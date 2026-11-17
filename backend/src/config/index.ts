import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001'],
  timezone: 'Africa/Algiers',
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://stadium:stadium@localhost:5432/stadium_dev',
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  url: process.env.REDIS_URL || 'redis://localhost:6379',
}));

export const jwtConfig = registerAs('jwt', () => ({
  // Retain the existing legacy fallback for local development only. Production
  // startup validation requires explicit, distinct access and refresh secrets.
  accessSecret:
    process.env.JWT_ACCESS_SECRET ||
    (process.env.NODE_ENV === 'production'
      ? undefined
      : process.env.JWT_SECRET || 'super-secret-key-123'),
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    (process.env.NODE_ENV === 'production'
      ? undefined
      : process.env.JWT_SECRET || 'super-secret-key-123'),
  accessExpiresIn: '15m',
  refreshExpiresIn: '7d',
  qrSecret:
    process.env.JWT_QR_SECRET ||
    (process.env.NODE_ENV === 'production' ? undefined : 'default_qr_secret'),
  qrExpiresIn: '5m',
}));

export const s3Config = registerAs('s3', () => ({
  endpoint: process.env.S3_ENDPOINT || '',
  accessKey: process.env.S3_ACCESS_KEY || '',
  secretKey: process.env.S3_SECRET_KEY || '',
  bucket: process.env.S3_BUCKET || 'stadium-media',
  region: process.env.S3_REGION || 'us-east-1',
}));

export const paymentConfig = registerAs('payment', () => ({
  provider: process.env.PAYMENT_PROVIDER || 'unconfigured',
  apiKey: process.env.PAYMENT_API_KEY || '',
  webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || undefined,
}));

export const firebaseConfig = registerAs('firebase', () => ({
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
}));
