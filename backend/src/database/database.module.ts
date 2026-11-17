import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const DATABASE_POOL = 'DATABASE_POOL';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: async (configService: ConfigService): Promise<Pool> => {
        const pool = new Pool({
          connectionString: configService.get<string>('database.url'),
          max: configService.get<number>('database.maxConnections', 20),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        });

        // Test connection
        const client = await pool.connect();
        try {
          await client.query('SELECT 1');
        } finally {
          client.release();
        }

        return pool;
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
