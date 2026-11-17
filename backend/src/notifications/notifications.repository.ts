import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class NotificationsRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async createNotification(data: any) {
    const {
      user_id,
      title_ar,
      title_fr,
      title_en,
      body_ar,
      body_fr,
      body_en,
      type,
      entity_type,
      entity_id,
    } = data;
    await this.pool.query(
      `INSERT INTO notifications 
      (user_id, title_ar, title_fr, title_en, body_ar, body_fr, body_en, type, entity_type, entity_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        user_id,
        title_ar,
        title_fr,
        title_en,
        body_ar,
        body_fr,
        body_en,
        type,
        entity_type,
        entity_id,
      ],
    );
  }

  async getNotifications(userId: string, limit: number, offset: number) {
    const res = await this.pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY read_at NULLS FIRST, created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset],
    );
    return res.rows;
  }

  async getUnreadCount(userId: string) {
    const res = await this.pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL',
      [userId],
    );
    return parseInt(res.rows[0].count, 10);
  }

  async markAsRead(id: string, userId: string) {
    return this.pool.query(
      'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
  }

  async markAllAsRead(userId: string) {
    await this.pool.query(
      'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
      [userId],
    );
  }
}
