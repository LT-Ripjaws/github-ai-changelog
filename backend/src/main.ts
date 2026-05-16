import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import session from 'express-session';
import cookieParser = require('cookie-parser');
import rateLimit from 'express-rate-limit';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  if (name === 'JWT_SECRET' && value.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  return value;
}

/** Idempotent schema bootstrap.
 * The project runs with TypeORM `synchronize: false`, so nothing else creates
 * tables. This raw-SQL bootstrap creates the full schema with IF NOT EXISTS,
 * which is additive and safe for databases that already have these tables.
 * Column types/nullability/defaults mirror the TypeORM entities; `status` is
 * varchar to match the entity's `simple-enum` mapping on Postgres.
 * commit_embeddings stays raw-SQL-only because TypeORM can't handle `vector`.
 * Order matters: parent tables before children so foreign keys resolve. */
async function ensureSchema(dataSource: DataSource) {
  await dataSource.query('CREATE EXTENSION IF NOT EXISTS vector');

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      github_id varchar NOT NULL UNIQUE,
      username varchar NOT NULL,
      display_name varchar,
      avatar_url varchar,
      email varchar,
      access_token varchar NOT NULL,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS repos (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      github_repo_id varchar NOT NULL,
      full_name varchar NOT NULL,
      name varchar NOT NULL,
      description varchar,
      default_branch varchar NOT NULL DEFAULT 'main',
      is_private boolean NOT NULL DEFAULT false,
      stars_count integer NOT NULL DEFAULT 0,
      language varchar,
      status varchar NOT NULL DEFAULT 'pending',
      error_message varchar,
      last_synced_at timestamp,
      total_commits_synced integer NOT NULL DEFAULT 0,
      total_commits_to_sync integer NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS commits (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      repo_id uuid NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
      sha varchar NOT NULL,
      message text NOT NULL,
      author_name varchar,
      author_email varchar,
      author_github_login varchar,
      diff_summary text,
      ai_changelog text,
      category varchar,
      files_changed integer NOT NULL DEFAULT 0,
      additions integer NOT NULL DEFAULT 0,
      deletions integer NOT NULL DEFAULT 0,
      is_merge_commit boolean NOT NULL DEFAULT false,
      committed_at timestamp NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS releases (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      repo_id uuid NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
      tag_name varchar NOT NULL,
      release_name varchar,
      raw_body text,
      ai_summary text,
      breaking_changes jsonb NOT NULL DEFAULT '[]'::jsonb,
      features jsonb NOT NULL DEFAULT '[]'::jsonb,
      fixes jsonb NOT NULL DEFAULT '[]'::jsonb,
      chores jsonb NOT NULL DEFAULT '[]'::jsonb,
      commits_count integer NOT NULL DEFAULT 0,
      released_at timestamp NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS release_commits (
      release_id uuid NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
      commit_id uuid NOT NULL REFERENCES commits(id) ON DELETE CASCADE,
      PRIMARY KEY (release_id, commit_id)
    )
  `);

  await dataSource.query(`CREATE INDEX IF NOT EXISTS idx_repos_user_created_at ON repos (user_id, created_at)`);
  await dataSource.query(`CREATE INDEX IF NOT EXISTS idx_commits_repo_committed_at ON commits (repo_id, committed_at)`);
  await dataSource.query(`CREATE INDEX IF NOT EXISTS idx_releases_repo_released_at ON releases (repo_id, released_at)`);

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS commit_embeddings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      commit_id UUID UNIQUE NOT NULL REFERENCES commits(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // Add column separately so it works whether the table was just created or already existed
  await dataSource.query(`ALTER TABLE commit_embeddings ADD COLUMN IF NOT EXISTS embedding vector(3072)`);

  // No index :(
  // pgvector index limit is 2000 dims, gemini-embedding-001 produces 3072.
  // Brute-force cosine similarity is fast enough for <100K vectors.

  // Commit SHAs are only unique inside a repository. Older dev schemas had a
  // global UNIQUE(sha) constraint, which can cross-link unrelated repos that
  // share a commit SHA.
  await dataSource.query(`
    DO $$
    DECLARE constraint_name text;
    BEGIN
      SELECT conname INTO constraint_name
      FROM pg_constraint
      WHERE conrelid = 'commits'::regclass
        AND contype = 'u'
        AND pg_get_constraintdef(oid) = 'UNIQUE (sha)'
      LIMIT 1;

      IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE commits DROP CONSTRAINT %I', constraint_name);
      END IF;
    END $$;
  `);
  await dataSource.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_commits_repo_sha_unique
    ON commits (repo_id, sha)
  `);
}

async function bootstrap() {
  const sessionSecret = getRequiredEnv('SESSION_SECRET');
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn', 'debug', 'verbose'] });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const frontendUrl = config.get<string>('FRONTEND_URL');
  if (!frontendUrl) {
    throw new Error('FRONTEND_URL is required');
  }
  const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';
  const port = config.get<number>('PORT') ?? 3001;

  // Security headers: CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy.
  // Swagger UI (dev/local only) needs inline scripts/styles that helmet's default
  // CSP blocks, so disable CSP only where Swagger is actually served.
  const swaggerEnabled = ['development', 'local'].includes(nodeEnv);
  app.use(helmet({ contentSecurityPolicy: swaggerEnabled ? false : undefined }));

  // Parse cookies for httpOnly JWT auth
  app.use(cookieParser());

  // Session store for OAuth state parameter (CSRF protection)
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: nodeEnv === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Run schema bootstrap on startup
  const dataSource = app.get(DataSource);
  await ensureSchema(dataSource);

  // CORS: allow frontend with credentials — strictly validated origin
  app.enableCors({ origin: frontendUrl, credentials: true });

  // === Swagger (before rate limiter so docs are accessible) ===
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Changelog Intelligence API')
    .setDescription('AI-powered GitHub changelog generator')
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  if (swaggerEnabled) {
    SwaggerModule.setup('api', app, swaggerDocument);
  }

  // Behind a reverse proxy (Railway etc.) the client IP is in X-Forwarded-For.
  // Trust exactly one proxy hop in production so the rate limiter keys on the
  // real client IP; in dev there is no proxy so we do not trust the header.
  app.getHttpAdapter().getInstance().set('trust proxy', nodeEnv === 'production' ? 1 : false);

  // === Rate limiting (defense in depth) ===
  // 100 req/5min per IP for general API, generous enough for dev tool
  // Excludes /health so load balancer checks don't throttle
  const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
    message: { message: 'Too many requests — please slow down.' },
  });
  app.use(limiter);

  // === CSRF protection for cookie-based auth ===
  const csrfMiddleware = new CsrfMiddleware(config);
  app.use((req, res, next) => csrfMiddleware.use(req, res, next));

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api`);
}
bootstrap();
