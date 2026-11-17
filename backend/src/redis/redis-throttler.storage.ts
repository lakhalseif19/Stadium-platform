import { ServiceUnavailableException } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/** Shared fixed-window throttler storage. Redis errors fail closed. */
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    try {
      const [totalHits, ttlMs, blocked] = (await this.redis.eval(
        `local blocked = redis.call('HGET', KEYS[1], 'blocked')
         if blocked == '1' then
           return {tonumber(redis.call('HGET', KEYS[1], 'hits') or '0'), redis.call('PTTL', KEYS[1]), 1}
         end
         local hits = redis.call('HINCRBY', KEYS[1], 'hits', 1)
         local remaining = redis.call('PTTL', KEYS[1])
         if remaining < 0 then
           redis.call('PEXPIRE', KEYS[1], ARGV[1])
           remaining = tonumber(ARGV[1])
         end
         if hits > tonumber(ARGV[2]) then
           redis.call('HSET', KEYS[1], 'blocked', '1')
           redis.call('PEXPIRE', KEYS[1], ARGV[3])
           return {hits, tonumber(ARGV[3]), 1}
         end
         return {hits, remaining, 0}`,
        1,
        `throttle:{${key}}`,
        ttl,
        limit,
        blockDuration,
      )) as [number, number, number];

      const timeToExpire = Math.max(0, Math.ceil(Number(ttlMs) / 1000));
      return {
        totalHits: Number(totalHits),
        timeToExpire,
        isBlocked: Number(blocked) === 1,
        timeToBlockExpire: Number(blocked) === 1 ? timeToExpire : 0,
      };
    } catch {
      throw new ServiceUnavailableException('Rate limiting service is unavailable');
    }
  }
}
