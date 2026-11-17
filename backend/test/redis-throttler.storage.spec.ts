import { ServiceUnavailableException } from '@nestjs/common';
import { RedisThrottlerStorage } from '../src/redis/redis-throttler.storage';

describe('RedisThrottlerStorage', () => {
  it('returns shared hit and block state from the atomic Redis operation', async () => {
    const redis = {
      eval: jest
        .fn()
        .mockResolvedValueOnce([1, 1000, 0])
        .mockResolvedValueOnce([3, 1000, 0])
        .mockResolvedValueOnce([4, 60000, 1])
        .mockResolvedValueOnce([4, 50000, 1]),
    };
    const storage = new RedisThrottlerStorage(redis as any);

    await expect(storage.increment('ip:user:auth', 60000, 3, 60000, 'short')).resolves.toEqual({
      totalHits: 1,
      timeToExpire: 1,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
    await storage.increment('ip:user:auth', 60000, 3, 60000, 'short');
    await expect(storage.increment('ip:user:auth', 60000, 3, 60000, 'short')).resolves.toEqual({
      totalHits: 4,
      timeToExpire: 60,
      isBlocked: true,
      timeToBlockExpire: 60,
    });
    await expect(
      storage.increment('ip:user:auth', 60000, 3, 60000, 'short'),
    ).resolves.toMatchObject({
      isBlocked: true,
      timeToBlockExpire: 50,
    });
    expect(redis.eval).toHaveBeenCalledTimes(4);
    expect(redis.eval.mock.calls[0][0]).toContain("redis.call('HINCRBY'");
  });

  it('fails closed when Redis is unavailable', async () => {
    const storage = new RedisThrottlerStorage({
      eval: jest.fn().mockRejectedValue(new Error('offline')),
    } as any);
    await expect(
      storage.increment('ip:user:auth', 60000, 3, 60000, 'short'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
