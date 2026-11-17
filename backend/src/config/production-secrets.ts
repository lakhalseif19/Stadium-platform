/** Fail closed for production while retaining existing local-development defaults. */
export function assertProductionSecrets(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return;

  for (const name of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'JWT_QR_SECRET']) {
    const value = env[name]?.trim();
    if (!value || value.length < 32 || /^(change[-_ ]?me|secret|default|dev[-_])/i.test(value)) {
      throw new Error(
        `Production configuration requires a strong ${name} value (at least 32 characters).`,
      );
    }
  }

  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    throw new Error(
      'Production configuration requires distinct JWT_ACCESS_SECRET and JWT_REFRESH_SECRET values.',
    );
  }

  const qrSecret = env.JWT_QR_SECRET?.trim();
  if (qrSecret === env.JWT_ACCESS_SECRET || qrSecret === env.JWT_REFRESH_SECRET) {
    throw new Error(
      'Production configuration requires a JWT_QR_SECRET distinct from access and refresh secrets.',
    );
  }

  if (!env.DATABASE_URL?.trim()) {
    throw new Error(
      'Production configuration requires DATABASE_URL; local database defaults are disabled.',
    );
  }
  if (!env.REDIS_HOST?.trim() || !env.REDIS_PASSWORD?.trim()) {
    throw new Error(
      'Production configuration requires REDIS_HOST and REDIS_PASSWORD for the shared Redis service.',
    );
  }

  const origins = env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (!origins?.length || origins.some((origin) => !origin.startsWith('https://'))) {
    throw new Error('Production configuration requires explicit HTTPS CORS_ORIGINS.');
  }
}
