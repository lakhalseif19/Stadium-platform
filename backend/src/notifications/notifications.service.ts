import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  async notifyUser(
    userId: string,
    type: string,
    titles: any,
    bodies: any,
    entityType?: string,
    entityId?: string,
  ) {
    const data = {
      user_id: userId,
      title_ar: titles.ar,
      title_fr: titles.fr,
      title_en: titles.en,
      body_ar: bodies.ar,
      body_fr: bodies.fr,
      body_en: bodies.en,
      type,
      entity_type: entityType,
      entity_id: entityId,
    };

    await this.repository.createNotification(data);
    return { inAppStatus: 'created', pushStatus: 'unavailable' };
  }

  async getNotifications(userId: string, limit: number, offset: number) {
    return this.repository.getNotifications(userId, limit, offset);
  }

  async getUnreadCount(userId: string) {
    return { count: await this.repository.getUnreadCount(userId) };
  }

  async markAsRead(id: string, userId: string) {
    const result = await this.repository.markAsRead(id, userId);
    if (result.rowCount !== 1) throw new NotFoundException('Notification not found');
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.repository.markAllAsRead(userId);
    return { success: true };
  }
}
