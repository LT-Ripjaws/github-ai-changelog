/**
 * Pins AiService fallback + retry behavior that Phase 3a (collapse 3 LLM calls
 * into 1) must preserve as the per-field fallback path. Pure unit test: the
 * OpenAI and Gemini SDKs are mocked; the private sleep() is stubbed so throttle
 * and retry backoff are instant.
 */
const mockKiloCreate = jest.fn();
const mockEmbedContent = jest.fn();

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockKiloCreate } },
  })),
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn(() => ({ embedContent: mockEmbedContent })),
  })),
}));

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { MetricsService } from '../common/metrics/metrics.service';
import { RedisRateLimiterService } from '../common/ratelimit/redis-rate-limiter.service';

const withStatus = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

describe('AiService', () => {
  let service: AiService;
  let metrics: { incCounter: jest.Mock; setGauge: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    metrics = { incCounter: jest.fn(), setGauge: jest.fn() };

    const config = {
      get: (key: string) =>
        ({
          KILOCODE_API_KEY: 'kilo-key',
          GEMINI_API_KEY: 'gemini-key',
          KILOCODE_MODEL: 'test-model',
        })[key],
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: config },
        { provide: MetricsService, useValue: metrics },
        { provide: RedisRateLimiterService, useValue: { throttle: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(AiService);
    // Neutralize throttle + retry backoff waits.
    jest.spyOn(service as unknown as { sleep: () => Promise<void> }, 'sleep').mockResolvedValue(undefined);
  });

  it('categorizeCommit falls back to "chore" for an invalid category', async () => {
    mockKiloCreate.mockResolvedValue({ choices: [{ message: { content: 'banana' } }] });
    await expect(service.categorizeCommit('msg', 'summary')).resolves.toBe('chore');
  });

  it('categorizeCommit falls back to "chore" when the provider errors non-retryably', async () => {
    mockKiloCreate.mockRejectedValue(withStatus('bad request', 400));
    await expect(service.categorizeCommit('msg', 'summary')).resolves.toBe('chore');
  });

  it('generateChangelog falls back to the raw commit message on empty AI output', async () => {
    mockKiloCreate.mockResolvedValue({ choices: [{ message: { content: '' } }] });
    await expect(service.generateChangelog('raw commit message', 1, 'summary')).resolves.toBe(
      'raw commit message',
    );
  });

  it('generateText retries on 429 then succeeds, counting both outcomes', async () => {
    mockKiloCreate
      .mockRejectedValueOnce(withStatus('rate limited, retry in 1s', 429))
      .mockResolvedValueOnce({ choices: [{ message: { content: 'feature' } }] });

    await expect(service.categorizeCommit('msg', 'summary')).resolves.toBe('feature');
    expect(mockKiloCreate).toHaveBeenCalledTimes(2);
    expect(metrics.incCounter).toHaveBeenCalledWith('ai_calls_total', {
      provider: 'kilo',
      outcome: 'error',
    });
    expect(metrics.incCounter).toHaveBeenCalledWith('ai_calls_total', {
      provider: 'kilo',
      outcome: 'success',
    });
  });

  it('generateEmbedding returns [] and counts an error on failure', async () => {
    mockEmbedContent.mockRejectedValue(withStatus('boom', 500));
    await expect(service.generateEmbedding('text')).resolves.toEqual([]);
    expect(metrics.incCounter).toHaveBeenCalledWith('ai_calls_total', {
      provider: 'gemini',
      outcome: 'error',
    });
  });

  it('generateEmbedding returns the vector and counts success', async () => {
    mockEmbedContent.mockResolvedValue({ embedding: { values: [0.1, 0.2, 0.3] } });
    await expect(service.generateEmbedding('text')).resolves.toEqual([0.1, 0.2, 0.3]);
    expect(metrics.incCounter).toHaveBeenCalledWith('ai_calls_total', {
      provider: 'gemini',
      outcome: 'success',
    });
  });

  it('analyzeCommit parses a single structured-JSON response', async () => {
    mockKiloCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content:
              '```json\n{"diffSummary":"sums it up","category":"Feature","changelog":"Add a thing"}\n```',
          },
        },
      ],
    });

    await expect(service.analyzeCommit('msg', 2, 'diff text')).resolves.toEqual({
      diffSummary: 'sums it up',
      category: 'feature',
      changelog: 'Add a thing',
    });
    expect(mockKiloCreate).toHaveBeenCalledTimes(1);
  });

  it('analyzeCommit falls back to the per-field path on unparseable output', async () => {
    mockKiloCreate.mockResolvedValue({ choices: [{ message: { content: 'not json at all' } }] });

    const result = await service.analyzeCommit('msg', 1, 'diff text');
    // Fallback ran: invalid category collapses to "chore", >1 LLM call made.
    expect(result.category).toBe('chore');
    expect(mockKiloCreate.mock.calls.length).toBeGreaterThan(1);
  });
});
