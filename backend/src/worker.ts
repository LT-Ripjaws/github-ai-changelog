import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { ensureSchema } from './bootstrap/ensure-schema';

/**
 * Worker entrypoint (ROLE=worker). Boots the same AppModule with no HTTP
 * server via createApplicationContext, so Bull processors run but the API
 * does not. Used only when the deployment splits web and worker; the default
 * ROLE=all keeps the monolith on main.ts exactly as before.
 *
 * Runs ensureSchema (idempotent, safe under concurrency) so a standalone
 * worker can operate, but NOT runMigrations — the web process owns migration
 * deltas to avoid two processes racing the same migration.
 */
async function bootstrapWorker() {
  const logger = new Logger('Worker');
  const appContext = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  appContext.enableShutdownHooks();

  const dataSource = appContext.get(DataSource);
  await ensureSchema(dataSource);

  logger.log(
    `Worker started (ROLE=${process.env.ROLE ?? 'all'}, ` +
      `SYNC_CONCURRENCY=${process.env.SYNC_CONCURRENCY ?? '1'}) — processing repo-sync jobs`,
  );
}
void bootstrapWorker();
