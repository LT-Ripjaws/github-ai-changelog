import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import session from 'express-session';
import cookieParser = require('cookie-parser');
import rateLimit from 'express-rate-limit';
import { ensureSchema } from './bootstrap/ensure-schema';

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

  // Run schema bootstrap on startup, then migration deltas.
  // Order matters: ensureSchema is the frozen idempotent baseline; migrations
  // (Phase 3+) only ever apply additive deltas on top of it. With zero
  // migration files this is a no-op and existing DBs see no schema change.
  const dataSource = app.get(DataSource);
  await ensureSchema(dataSource);
  const executedMigrations = await dataSource.runMigrations();
  if (executedMigrations.length > 0) {
    logger.log(
      `Applied ${executedMigrations.length} migration(s): ${executedMigrations
        .map((m) => m.name)
        .join(', ')}`,
    );
  }

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
  // 300 req/5min per IP — generous enough for dev tool + frontend polling.
  // Excludes /health (load balancer) and status-polling endpoints so the
  // frontend's 2-second poll loop can't exhaust the budget during a sync.
  const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) =>
      req.path === '/health' ||
      req.path === '/metrics' ||
      /^\/repos\/[^/]+\/status(\/stream)?$/.test(req.path),
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
