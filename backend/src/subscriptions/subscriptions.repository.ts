import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class SubscriptionsRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async listByUser(userId: string) {
    const res = await this.pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);
    return res.rows;
  }

  async cancelActiveByUser(id: string, userId: string) {
    return this.pool.query(
      `UPDATE subscriptions
       SET status = 'CANCELLED', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'ACTIVE'
       RETURNING *`,
      [id, userId],
    );
  }
}
