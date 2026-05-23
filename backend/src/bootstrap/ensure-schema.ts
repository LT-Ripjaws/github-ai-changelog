import { DataSource } from 'typeorm';

/** Idempotent schema bootstrap (FROZEN BASELINE — do not rewrite).
 * The project runs with TypeORM `synchronize: false`, so nothing else creates
 * tables. This raw-SQL bootstrap creates the full schema with IF NOT EXISTS,
 * which is additive and safe for databases that already have these tables.
 * Column types/nullability/defaults mirror the TypeORM entities; `status` is
 * varchar to match the entity's `simple-enum` mapping on Postgres.
 * commit_embeddings stays raw-SQL-only because TypeORM can't handle `vector`.
 * Order matters: parent tables before children so foreign keys resolve.
 * All schema changes from Phase 3+ go through TypeORM migrations, never here.
 * Extracted verbatim from main.ts so the worker process can reuse it. */
export async function ensureSchema(dataSource: DataSource) {
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
