import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from './database/database.module';
import { REDIS_CLIENT, RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RbacModule } from './rbac/rbac.module';
import { StadiumsModule } from './stadiums/stadiums.module';
import { FieldsModule } from './fields/fields.module';
import { StadiumMediaModule } from './stadium-media/stadium-media.module';
import { SeasonsModule } from './seasons/seasons.module';
import { PricingModule } from './pricing/pricing.module';
import { ReservationsModule } from './reservations/reservations.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TeamsModule } from './teams/teams.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { ClosuresModule } from './closures/closures.module';
import { PaymentsModule } from './payments/payments.module';
import { CheckInModule } from './check-in/check-in.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { appConfig, databaseConfig, redisConfig, jwtConfig, s3Config } from './config';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './rbac/guards/roles.guard';
import { PermissionsGuard } from './rbac/guards/permissions.guard';
import { assertProductionSecrets } from './config/production-secrets';
import Redis from 'ioredis';
import { RedisThrottlerStorage } from './redis/redis-throttler.storage';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig, s3Config],
      envFilePath: ['.env'],
      validate: (env) => {
        assertProductionSecrets(env);
        return env;
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis) => ({
        storage: new RedisThrottlerStorage(redis),
        throttlers: [
          { name: 'short', ttl: 1000, limit: 3 },
          { name: 'medium', ttl: 10000, limit: 20 },
          { name: 'long', ttl: 60000, limit: 100 },
        ],
      }),
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
        },
      }),
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RbacModule,
    StadiumsModule,
    FieldsModule,
    StadiumMediaModule,
    SeasonsModule,
    PricingModule,
    ReservationsModule,
    SubscriptionsModule,
    TeamsModule,
    TournamentsModule,
    ClosuresModule,
    PaymentsModule,
    CheckInModule,
    NotificationsModule,
    AuditModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
