import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { SubscriptionsService } from '../src/subscriptions/subscriptions.service';

describe('SubscriptionsService', () => {
  it('does not create an active subscription while real payment is unavailable', async () => {
    const repository = { listByUser: jest.fn(), cancelActiveByUser: jest.fn() };
    const service = new SubscriptionsService(repository as any);
    await expect(service.createSubscription({} as any, 'user-1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(repository.cancelActiveByUser).not.toHaveBeenCalled();
  });

  it('cancels only the active subscription owned by the requesting user', async () => {
    const row = { id: 'sub-1', user_id: 'user-1', status: 'CANCELLED' };
    const repository = {
      cancelActiveByUser: jest.fn().mockResolvedValue({ rowCount: 1, rows: [row] }),
    };
    const service = new SubscriptionsService(repository as any);
    await expect(service.cancelSubscription('sub-1', 'user-1')).resolves.toEqual(row);
    expect(repository.cancelActiveByUser).toHaveBeenCalledWith('sub-1', 'user-1');
  });

  it('does not report success for an unowned or non-active subscription', async () => {
    const repository = {
      cancelActiveByUser: jest.fn().mockResolvedValue({ rowCount: 0, rows: [] }),
    };
    const service = new SubscriptionsService(repository as any);
    await expect(service.cancelSubscription('sub-1', 'other-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
