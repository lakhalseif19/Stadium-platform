import { NotificationProcessor } from '../src/notifications/processor/notification.processor';
import { NotificationsService } from '../src/notifications/notifications.service';

describe('notification delivery status', () => {
  it('reports in-app persistence and explicitly unavailable push delivery', async () => {
    const repository = { createNotification: jest.fn().mockResolvedValue(undefined) };
    const service = new NotificationsService(repository as any);

    await expect(
      service.notifyUser('user-1', 'SYSTEM', { en: 'Title' }, { en: 'Body' }),
    ).resolves.toEqual({ inAppStatus: 'created', pushStatus: 'unavailable' });
    expect(repository.createNotification).toHaveBeenCalledTimes(1);
  });

  it('never returns a fabricated push success for queued jobs', async () => {
    const processor = new NotificationProcessor();
    await expect(processor.process({ id: 'job-1' } as any)).resolves.toEqual({
      pushStatus: 'unavailable',
    });
  });
});
