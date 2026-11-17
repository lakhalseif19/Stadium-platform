import { Controller, Get, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { DATABASE_POOL } from '../database/database.module';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Pool } from 'pg';
import Redis from 'ioredis';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  async ready() {
    let dbStatus = 'down';
    let redisStatus = 'down';
    try {
      await this.pool.query('SELECT 1');
      dbStatus = 'up';
    } catch {
      dbStatus = 'down';
    }
    try {
      if ((await this.redis.ping()) === 'PONG') {
        redisStatus = 'up';
      }
    } catch {
      redisStatus = 'down';
    }
    const isReady = dbStatus === 'up' && redisStatus === 'up';
    const result = {
      status: isReady ? 'ready' : 'not_ready',
      dependencies: { database: dbStatus, redis: redisStatus },
    };
    if (!isReady) {
      throw new HttpException(result, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return result;
  }
}
