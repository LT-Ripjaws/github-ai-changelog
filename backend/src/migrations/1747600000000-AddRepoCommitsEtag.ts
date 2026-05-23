import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * First migration (Phase 3b). Additive only: adds the per-repo GitHub
 * commits-list ETag column used for conditional (If-None-Match) fetches.
 * IF NOT EXISTS so it is safe on any existing database. Runs after the
 * frozen ensureSchema() baseline in main.ts.
 */
export class AddRepoCommitsEtag1747600000000 implements MigrationInterface {
  name = 'AddRepoCommitsEtag1747600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "repos" ADD COLUMN IF NOT EXISTS "commits_etag" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "repos" DROP COLUMN IF EXISTS "commits_etag"`,
    );
  }
}
