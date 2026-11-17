import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../src/notifications/notifications.service';

describe('NotificationsService ownership', () => {
  it('reports success only when the user-scoped update changes a row', async () => {
    const repository = { markAsRead: jest.fn().mockResolvedValue({ rowCount: 1 }) };
    const service = new NotificationsService(repository as any);

    await expect(service.markAsRead('notification-1', 'user-1')).resolves.toEqual({
      success: true,
    });
    expect(repository.markAsRead).toHaveBeenCalledWith('notification-1', 'user-1');
  });

  it('does not report success for a missing or unowned notification', async () => {
    const repository = { markAsRead: jest.fn().mockResolvedValue({ rowCount: 0 }) };
    const service = new NotificationsService(repository as any);

    await expect(service.markAsRead('notification-1', 'other-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
