import { Module } from '@nestjs/common';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ReposModule } from './repos/repos.module';
import { CommitsModule } from './commits/commits.module';
import { ReleasesModule } from './releases/releases.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { JobsModule } from './jobs/jobs.module';
import { AiModule } from './ai/ai.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { RatelimitModule } from './common/ratelimit/ratelimit.module';
import { RedisPubSubModule } from './common/pubsub/redis-pubsub.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: +config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
        dropSchema: false,
        // Migrations are registered so main.ts can run them explicitly after
        // ensureSchema(). migrationsRun is intentionally NOT set: the Nest
        // DataSource initializes during NestFactory.create(), before
        // ensureSchema() runs in bootstrap(), so auto-run would execute
        // deltas before the baseline exists. Glob is compiled JS only.
        migrations: [join(__dirname, 'migrations', '*.js')],
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST'),
          port: +config.get('REDIS_PORT'),
          password: config.get<string>('REDIS_PASSWORD', ''),
        },
      }),
    }),
    AuthModule,
    UsersModule,
    ReposModule,
    CommitsModule,
    ReleasesModule,
    AnalyticsModule,
    JobsModule,
    AiModule,
    MetricsModule,
    RatelimitModule,
    RedisPubSubModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
