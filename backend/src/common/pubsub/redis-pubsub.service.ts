import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface RepoStatusSnapshot {
  status: string;
  totalCommitsSynced: number;
  totalCommitsToSync: number;
  errorMessage: string | null;
  lastSyncedAt: Date | null;
}

/**
 * Phase 4: thin Redis pub/sub used to push repo-sync progress to SSE
 * subscribers. The publisher is one shared connection; each SSE stream gets
 * its own duplicated subscriber connection (ioredis requires a connection in
 * subscriber mode) that is closed when the client disconnects.
 *
 * Publishing is fail-soft: if Redis is unavailable the sync is unaffected and
 * the frontend falls back to polling.
 */
@Injectable()
export class RedisPubSubService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private readonly publisher: Redis;

  constructor(config: ConfigService) {
    this.publisher = new Redis({
      host: config.get<string>('REDIS_HOST'),
      port: Number(config.get('REDIS_PORT')),
      password: config.get<string>('REDIS_PASSWORD', ''),
      maxRetriesPerRequest: null,
    });
    this.publisher.on('error', (e) =>
      this.logger.warn(`Redis pubsub error: ${e.message}`),
    );
  }

  channel(repoId: string): string {
    return `repo-status:${repoId}`;
  }

  async publish(channel: string, payload: unknown): Promise<void> {
    try {
      await this.publisher.publish(channel, JSON.stringify(payload));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`publish to ${channel} failed: ${message}`);
    }
  }

  async subscribe(
    channel: string,
    onMessage: (data: unknown) => void,
  ): Promise<{ close: () => void }> {
    const sub = this.publisher.duplicate();
    await sub.subscribe(channel);
    sub.on('message', (ch, message) => {
      if (ch !== channel) return;
      try {
        onMessage(JSON.parse(message));
      } catch {
        // ignore malformed payloads
      }
    });
    return {
      close: () => {
        sub.quit().catch(() => undefined);
      },
    };
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.publisher.quit();
    } catch {
      // ignore shutdown errors
    }
  }
}
