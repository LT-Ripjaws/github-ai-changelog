import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

/** Ensure pgvector extension, table, and index exist.
 * The commit_embeddings table is NOT managed by TypeORM (it can't handle vector).
 * All operations on it use raw SQL. */
async function ensurePgvectorSetup(dataSource: DataSource) {
  await dataSource.query('CREATE EXTENSION IF NOT EXISTS vector');

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
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Run pgvector migration on startup
  const dataSource = app.get(DataSource);
  await ensurePgvectorSetup(dataSource);

  app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Changelog Intelligence API')
    .setDescription('AI-powered GitHub changelog generator')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api', app, swaggerDocument);
  }

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Server running on http://localhost:${process.env.PORT ?? 3001}`);
  console.log(`Swagger docs at http://localhost:${process.env.PORT ?? 3001}/api`);
}
bootstrap();
