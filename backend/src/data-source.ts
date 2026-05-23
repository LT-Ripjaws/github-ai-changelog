import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';

/**
 * Standalone DataSource for the TypeORM CLI (migration:generate/run/revert).
 * Mirrors the runtime TypeORM config in app.module.ts. Globs use {ts,js} so the
 * same file works under ts-node (src/*.ts) and compiled (dist/*.js).
 * The runtime app does NOT use this; it runs migrations via the Nest DataSource
 * in main.ts after ensureSchema().
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '/**/*.entity.{ts,js}')],
  migrations: [join(__dirname, '/migrations/*.{ts,js}')],
  synchronize: false,
});
