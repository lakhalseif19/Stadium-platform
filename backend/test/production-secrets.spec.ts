import { assertProductionSecrets } from '../src/config/production-secrets';
import { jwtConfig, paymentConfig } from '../src/config';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthModule } from '../src/auth/auth.module';
import { AuthService } from '../src/auth/auth.service';

const validProductionEnv: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  JWT_ACCESS_SECRET: 'a'.repeat(40),
  JWT_REFRESH_SECRET: 'c'.repeat(40),
  JWT_QR_SECRET: 'b'.repeat(40),
  DATABASE_URL: 'postgresql://app:placeholder@postgres:5432/stadium',
  REDIS_HOST: 'redis',
  REDIS_PASSWORD: 'redis-placeholder-password',
  CORS_ORIGINS: 'https://admin.example.test',
};

describe('production secret configuration', () => {
  it('rejects missing or weak production JWT secrets', () => {
    expect(() => assertProductionSecrets({ NODE_ENV: 'production' })).toThrow(/JWT_ACCESS_SECRET/);
    expect(() =>
      assertProductionSecrets({
        ...validProductionEnv,
        JWT_QR_SECRET: 'dev-qr-secret-change-in-production',
      }),
    ).toThrow(/JWT_QR_SECRET/);
  });

  it('accepts strong production secrets', () => {
    expect(() => assertProductionSecrets(validProductionEnv)).not.toThrow();
  });

  it('rejects reusing the same production key for access and refresh tokens', () => {
    const shared = 'x'.repeat(40);
    expect(() =>
      assertProductionSecrets({
        ...validProductionEnv,
        JWT_ACCESS_SECRET: shared,
        JWT_REFRESH_SECRET: shared,
      }),
    ).toThrow(/distinct/i);
  });

  it('preserves local development defaults', () => {
    expect(() => assertProductionSecrets({ NODE_ENV: 'development' })).not.toThrow();
  });

  it('requires explicit production database, authenticated Redis, and HTTPS CORS settings', () => {
    expect(() =>
      assertProductionSecrets({ ...validProductionEnv, DATABASE_URL: undefined }),
    ).toThrow(/DATABASE_URL/);
    expect(() =>
      assertProductionSecrets({ ...validProductionEnv, REDIS_PASSWORD: undefined }),
    ).toThrow(/REDIS_HOST and REDIS_PASSWORD/);
    expect(() =>
      assertProductionSecrets({ ...validProductionEnv, CORS_ORIGINS: 'http://admin.example.test' }),
    ).toThrow(/HTTPS CORS_ORIGINS/);
  });

  it('requires an independent QR signing key', () => {
    expect(() =>
      assertProductionSecrets({
        ...validProductionEnv,
        JWT_QR_SECRET: validProductionEnv.JWT_ACCESS_SECRET,
      }),
    ).toThrow(/JWT_QR_SECRET distinct/);
  });

  it('does not expose known JWT or QR fallbacks in production configuration', () => {
    const names = [
      'NODE_ENV',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'JWT_SECRET',
      'JWT_QR_SECRET',
    ] as const;
    const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));

    try {
      process.env.NODE_ENV = 'production';
      for (const name of names.slice(1)) delete process.env[name];

      const config = jwtConfig();
      expect(config.accessSecret).toBeUndefined();
      expect(config.refreshSecret).toBeUndefined();
      expect(config.qrSecret).toBeUndefined();
    } finally {
      for (const name of names) {
        const value = previous[name];
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
  });

  it('does not expose a known payment webhook secret fallback', () => {
    const previous = process.env.PAYMENT_WEBHOOK_SECRET;
    try {
      delete process.env.PAYMENT_WEBHOOK_SECRET;
      expect(paymentConfig().webhookSecret).toBeUndefined();
    } finally {
      if (previous === undefined) delete process.env.PAYMENT_WEBHOOK_SECRET;
      else process.env.PAYMENT_WEBHOOK_SECRET = previous;
    }
  });

  it('provides the configured access key to JwtModule without a module-level fallback', async () => {
    const previousSecret = process.env.JWT_ACCESS_SECRET;
    const configuredSecret = 'phase5-test-access-secret-value-1234567890';
    process.env.JWT_ACCESS_SECRET = configuredSecret;

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [jwtConfig],
        }),
        AuthModule,
      ],
    })
      .overrideProvider(AuthService)
      .useValue({})
      .compile();

    try {
      const jwtService = moduleRef.get(JwtService);
      const token = await jwtService.signAsync({ sub: 'configured-key-check' });

      await expect(
        jwtService.verifyAsync(token, { secret: configuredSecret }),
      ).resolves.toMatchObject({ sub: 'configured-key-check' });
    } finally {
      await moduleRef.close();
      if (previousSecret === undefined) delete process.env.JWT_ACCESS_SECRET;
      else process.env.JWT_ACCESS_SECRET = previousSecret;
    }
  });
});
