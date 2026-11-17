import { assertProductionSecrets } from '../src/config/production-secrets';

describe('production secret configuration', () => {
  it('rejects missing or weak production JWT secrets', () => {
    expect(() => assertProductionSecrets({ NODE_ENV: 'production' })).toThrow(/JWT_ACCESS_SECRET/);
    expect(() =>
      assertProductionSecrets({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'a'.repeat(40),
        JWT_REFRESH_SECRET: 'c'.repeat(40),
        JWT_QR_SECRET: 'dev-qr-secret-change-in-production',
      }),
    ).toThrow(/JWT_QR_SECRET/);
  });

  it('accepts strong production secrets', () => {
    expect(() =>
      assertProductionSecrets({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'a'.repeat(40),
        JWT_REFRESH_SECRET: 'c'.repeat(40),
        JWT_QR_SECRET: 'b'.repeat(40),
      }),
    ).not.toThrow();
  });

  it('rejects reusing the same production key for access and refresh tokens', () => {
    const shared = 'x'.repeat(40);
    expect(() =>
      assertProductionSecrets({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: shared,
        JWT_REFRESH_SECRET: shared,
        JWT_QR_SECRET: 'y'.repeat(40),
      }),
    ).toThrow(/distinct/i);
  });

  it('preserves local development defaults', () => {
    expect(() => assertProductionSecrets({ NODE_ENV: 'development' })).not.toThrow();
  });
});
