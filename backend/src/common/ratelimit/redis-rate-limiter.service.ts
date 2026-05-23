import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Distributed minimum-interval limiter (atomic Redis slot reservation).
 *
 * Preserves the exact semantics of the old in-memory throttle — at least
 * `minIntervalMs` between calls for a given key — but correct across N
 * processes. Each caller atomically reserves the next free slot and is told
 * how long to wait; concurrent callers serialize with `minIntervalMs`
 * spacing. With one idle process this returns 0 (identical to before).
 */
@Injectable()
export class RedisRateLimiterService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisRateLimiterService.name);
  private readonly redis: Redis;

  // KEYS[1]=slot key, ARGV[1]=now(ms), ARGV[2]=interval(ms) -> wait ms
  private static readonly RESERVE_SLOT = `
    local last = tonumber(redis.call('get', KEYS[1]) or '0')
    local now = tonumber(ARGV[1])
    local interval = tonumber(ARGV[2])
    local slot = now
    if last + interval > now then slot = last + interval end
    redis.call('set', KEYS[1], slot, 'px', interval * 10)
    return slot - now
  `;

  constructor(config: ConfigService) {
    this.redis = new Redis({
      host: config.get<string>('REDIS_HOST'),
      port: Number(config.get('REDIS_PORT')),
      password: config.get<string>('REDIS_PASSWORD', ''),
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    this.redis.on('error', (e) => this.logger.warn(`Redis limiter error: ${e.message}`));
  }

  async throttle(key: string, minIntervalMs: number): Promise<void> {
    try {
      if (this.redis.status === 'wait' || this.redis.status === 'close') {
        await this.redis.connect();
      }
      const waitMs = (await this.redis.eval(
        RedisRateLimiterService.RESERVE_SLOT,
        1,
        key,
        Date.now().toString(),
        String(minIntervalMs),
      )) as number;
      if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
    } catch (err: unknown) {
      // Fail open with a local wait rather than blocking syncs if Redis is down.
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Limiter degraded (${message}); falling back to local wait`);
      await new Promise((r) => setTimeout(r, minIntervalMs));
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
    } catch {
      // ignore shutdown errors
    }
  }
}
