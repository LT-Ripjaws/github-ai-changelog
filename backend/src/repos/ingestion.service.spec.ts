/**
 * Pins the riskiest IngestionService behaviors that Phase 3 (collapse LLM
 * calls + incremental GitHub sync) will refactor:
 *  - skip-if-AI-already-populated (no redundant AI calls)
 *  - mid-sync repo-deleted bailout (no work after the repo disappears)
 *  - embedding insert SQL + release→commit linking inside the txn
 * All repositories/services are mocked; private sleep() is stubbed.
 */
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { IngestionService } from './ingestion.service';
import { GithubService } from './github.service';
import { RepoEntity, RepoStatus } from './entities/repo.entity';
import { CommitEntity } from '../commits/entities/commit.entity';
import { ReleaseEntity } from '../releases/entities/release.entity';
import { AiService } from '../ai/ai.service';
import { UsersService } from '../users/users.service';
import { RedisPubSubService } from '../common/pubsub/redis-pubsub.service';

const REPO = { id: 'repo-1', userId: 'user-1', fullName: 'octo/repo' };

function rawCommit(sha: string) {
  return {
    sha,
    parents: [],
    commit: {
      message: `message ${sha}`,
      author: { name: 'A', email: 'a@x.com', date: '2024-01-01T00:00:00Z' },
      committer: { name: 'A', email: 'a@x.com', date: '2024-01-01T00:00:00Z' },
    },
    author: { login: 'a' },
  };
}

describe('IngestionService.syncRepo', () => {
  let service: IngestionService;
  let reposRepo: Record<string, jest.Mock>;
  let commitsRepo: Record<string, jest.Mock>;
  let releasesRepo: { findOne: jest.Mock; manager: { transaction: jest.Mock } };
  let dataSource: { query: jest.Mock };
  let github: Record<string, jest.Mock>;
  let ai: Record<string, jest.Mock>;
  let users: Record<string, jest.Mock>;
  let txnQuery: jest.Mock;

  beforeEach(async () => {
    reposRepo = {
      findOne: jest.fn().mockResolvedValue(REPO),
      update: jest.fn().mockResolvedValue(undefined),
      increment: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(1),
    };
    commitsRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(1),
      findBy: jest.fn().mockResolvedValue([]),
    };
    txnQuery = jest.fn((sql: string) =>
      sql.includes('RETURNING id')
        ? Promise.resolve([{ id: 'release-1' }])
        : Promise.resolve(undefined),
    );
    releasesRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      manager: { transaction: jest.fn(async (cb: (t: unknown) => unknown) => cb({ query: txnQuery })) },
    };
    dataSource = { query: jest.fn().mockResolvedValue(undefined) };
    github = {
      getCommits: jest.fn().mockResolvedValue([]),
      getCommitsIncremental: jest.fn(),
      getCommitDetail: jest.fn(),
      getReleases: jest.fn().mockResolvedValue([]),
      compareCommits: jest.fn(),
    };
    ai = {
      generateDiffSummary: jest.fn().mockResolvedValue('diff summary'),
      categorizeCommit: jest.fn().mockResolvedValue('feature'),
      generateChangelog: jest.fn().mockResolvedValue('changelog'),
      generateEmbedding: jest.fn().mockResolvedValue([]),
      generateReleaseSummary: jest.fn().mockResolvedValue('release summary'),
    };
    users = {
      findById: jest.fn().mockResolvedValue({ id: 'user-1' }),
      getAccessToken: jest.fn().mockResolvedValue('gh-token'),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: getRepositoryToken(RepoEntity), useValue: reposRepo },
        { provide: getRepositoryToken(CommitEntity), useValue: commitsRepo },
        { provide: getRepositoryToken(ReleaseEntity), useValue: releasesRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: GithubService, useValue: github },
        { provide: AiService, useValue: ai },
        { provide: UsersService, useValue: users },
        {
          provide: RedisPubSubService,
          useValue: { publish: jest.fn(), channel: (id: string) => `repo-status:${id}` },
        },
      ],
    }).compile();

    service = moduleRef.get(IngestionService);
    jest.spyOn(service as unknown as { sleep: () => Promise<void> }, 'sleep').mockResolvedValue(undefined);
  });

  it('skips commits already populated with AI fields (no redundant AI calls)', async () => {
    github.getCommits.mockResolvedValue([rawCommit('sha-1')]);
    commitsRepo.findOne.mockResolvedValue({
      id: 'commit-1',
      aiChangelog: 'existing',
      diffSummary: 'existing',
    });

    await service.syncRepo('repo-1');

    expect(ai.generateDiffSummary).not.toHaveBeenCalled();
    expect(ai.categorizeCommit).not.toHaveBeenCalled();
    expect(ai.generateChangelog).not.toHaveBeenCalled();
    expect(commitsRepo.save).not.toHaveBeenCalled();
    expect(reposRepo.update).toHaveBeenCalledWith(
      'repo-1',
      expect.objectContaining({ status: RepoStatus.Ready }),
    );
  });

  it('bails out mid-sync when the repo is deleted (no AI work, no completion)', async () => {
    github.getCommits.mockResolvedValue([rawCommit('sha-1')]);
    // initial fetch returns the repo; the in-loop existence check returns null.
    reposRepo.findOne.mockResolvedValueOnce(REPO).mockResolvedValueOnce(null);

    await service.syncRepo('repo-1');

    expect(ai.generateDiffSummary).not.toHaveBeenCalled();
    expect(commitsRepo.save).not.toHaveBeenCalled();
    expect(commitsRepo.count).not.toHaveBeenCalled();
    expect(reposRepo.update).not.toHaveBeenCalledWith(
      'repo-1',
      expect.objectContaining({ status: RepoStatus.Ready }),
    );
  });

  it('inserts the embedding and links release commits inside the transaction', async () => {
    github.getCommits.mockResolvedValue([rawCommit('sha-1')]);
    commitsRepo.findOne.mockResolvedValue(null); // new commit
    github.getCommitDetail.mockResolvedValue({
      files: [{ filename: 'f.ts', patch: '@@ patch', additions: 1, deletions: 0, changes: 1 }],
      stats: { additions: 1, deletions: 0, total: 1 },
    });
    ai.generateEmbedding.mockResolvedValue([0.1, 0.2]);
    commitsRepo.save.mockResolvedValue({ id: 'commit-1' });
    commitsRepo.findBy.mockResolvedValue([
      { id: 'commit-1', category: 'feature', aiChangelog: 'changelog', message: 'm' },
    ]);
    // Two releases so the previous-tag comparison path runs.
    github.getReleases.mockResolvedValue([
      { tag_name: 'v2', name: 'v2', body: 'b', published_at: '2024-02-01T00:00:00Z' },
      { tag_name: 'v1', name: 'v1', body: 'b', published_at: '2024-01-01T00:00:00Z' },
    ]);
    github.compareCommits.mockResolvedValue({ commits: [{ sha: 'sha-1' }] });

    await service.syncRepo('repo-1');

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO commit_embeddings'),
      ['commit-1', '[0.1,0.2]'],
    );
    expect(txnQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO release_commits'),
      ['release-1', 'commit-1'],
    );
  });

  it('INCREMENTAL_SYNC: a GitHub 304 marks ready with no AI work or fetch', async () => {
    const prev = process.env.INCREMENTAL_SYNC;
    process.env.INCREMENTAL_SYNC = 'on';
    try {
      github.getCommitsIncremental.mockResolvedValue({
        notModified: true,
        etag: 'W/"abc"',
        commits: [],
      });

      await service.syncRepo('repo-1');

      expect(github.getCommitsIncremental).toHaveBeenCalled();
      expect(github.getCommits).not.toHaveBeenCalled();
      expect(ai.generateDiffSummary).not.toHaveBeenCalled();
      expect(ai.categorizeCommit).not.toHaveBeenCalled();
      expect(commitsRepo.save).not.toHaveBeenCalled();
      expect(reposRepo.update).toHaveBeenCalledWith('repo-1', { status: RepoStatus.Ready });
    } finally {
      if (prev === undefined) delete process.env.INCREMENTAL_SYNC;
      else process.env.INCREMENTAL_SYNC = prev;
    }
  });
});
