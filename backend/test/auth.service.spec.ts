import * as argon2 from 'argon2';
import { ServiceUnavailableException } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';

const jwtConfig = {
  get: (key: string) => (key === 'jwt.accessSecret' ? 'access-secret' : 'refresh-secret'),
};

describe('AuthService refresh token rotation', () => {
  it('rejects a revoked refresh token when Redis no longer holds its hash', async () => {
    const pool = { query: jest.fn() };
    const redis = { get: jest.fn().mockResolvedValue(null) };
    const service = new AuthService(pool as any, redis as any, {} as any, jwtConfig as any);

    await expect(service.refresh('user-1', 'revoked-token')).rejects.toThrow(/invalid/i);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('allows only one concurrent use of the same refresh token', async () => {
    const originalToken = 'current-refresh-token';
    const originalHash = await argon2.hash(originalToken, {
      timeCost: 2,
      memoryCost: 1024,
    });
    let storedHash = originalHash;
    let signedToken = 0;

    const pool = {
      query: jest.fn(async (query: string) => {
        if (query.includes('FROM users')) {
          return {
            rows: [
              {
                id: 'user-1',
                phone: '+213555000000',
                email: null,
                first_name: 'Test',
                last_name: 'User',
              },
            ],
          };
        }
        return { rows: [] };
      }),
    };
    const redis = {
      get: jest.fn(async () => originalHash),
      eval: jest.fn(
        async (
          _script: string,
          _keyCount: number,
          _key: string,
          expected: string,
          next: string,
        ) => {
          if (storedHash !== expected) return 0;
          storedHash = next;
          return 1;
        },
      ),
    };
    const jwt = {
      signAsync: jest.fn(async () => `rotated-${++signedToken}`),
    };

    const service = new AuthService(pool as any, redis as any, jwt as any, jwtConfig as any);
    const results = await Promise.allSettled([
      service.refresh('user-1', originalToken),
      service.refresh('user-1', originalToken),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(redis.eval).toHaveBeenCalledTimes(2);
  });
});

describe('AuthService OTP consumption', () => {
  it('allows only one concurrent verification to consume an OTP', async () => {
    const code = '123456';
    const otpHash = await argon2.hash(code, { timeCost: 2, memoryCost: 1024 });
    let consumed = false;
    const redis = {
      get: jest.fn(async () => otpHash),
      eval: jest.fn(async (script: string) => {
        if (script.includes("redis.call('INCR'")) return 1;
        if (consumed) return 0;
        consumed = true;
        return 1;
      }),
    };
    const pool = { query: jest.fn(async () => ({ rowCount: 1 })) };
    const service = new AuthService(pool as any, redis as any, {} as any, jwtConfig as any);

    const results = await Promise.allSettled([
      service.verifyOtp('+213555000000', code),
      service.verifyOtp('+213555000000', code),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(redis.eval).toHaveBeenCalledTimes(4);
  });

  it('rejects expired and invalid codes without verifying an account', async () => {
    const pool = { query: jest.fn() };
    const expired = new AuthService(
      pool as any,
      { eval: jest.fn().mockResolvedValue(1), get: jest.fn().mockResolvedValue(null) } as any,
      {} as any,
      jwtConfig as any,
    );
    await expect(expired.verifyOtp('+213555000000', '123456')).rejects.toThrow(
      /expired or invalid/i,
    );

    const hash = await argon2.hash('123456', { timeCost: 2, memoryCost: 1024 });
    const invalid = new AuthService(
      pool as any,
      { eval: jest.fn().mockResolvedValue(1), get: jest.fn().mockResolvedValue(hash) } as any,
      {} as any,
      jwtConfig as any,
    );
    await expect(invalid.verifyOtp('+213555000000', '000000')).rejects.toThrow(/invalid otp/i);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('fails closed when Redis is unavailable', async () => {
    const pool = { query: jest.fn() };
    const service = new AuthService(
      pool as any,
      { eval: jest.fn().mockRejectedValue(new Error('offline')) } as any,
      {} as any,
      jwtConfig as any,
    );
    await expect(service.verifyOtp('+213555000000', '123456')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(pool.query).not.toHaveBeenCalled();
  });
});

describe('AuthService registration and verification policy', () => {
  it('does not create an account when no verification delivery provider exists', async () => {
    const pool = { connect: jest.fn() };
    const service = new AuthService(pool as any, {} as any, {} as any, jwtConfig as any);
    await expect(
      service.register({
        phone: '+213555000000',
        password: 'safe-password',
        first_name: 'Test',
        last_name: 'User',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it('requires email verification before email login', async () => {
    const passwordHash = await argon2.hash('safe-password', { timeCost: 2, memoryCost: 1024 });
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [
          { id: 'user-1', password_hash: passwordHash, is_active: true, email_verified_at: null },
        ],
      }),
    };
    const service = new AuthService(pool as any, {} as any, {} as any, jwtConfig as any);
    await expect(
      service.login({ email: 'person@example.test', password: 'safe-password' }),
    ).rejects.toThrow(/verification required/i);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});
