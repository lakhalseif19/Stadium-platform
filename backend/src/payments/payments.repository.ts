import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class PaymentsRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  // Payment creation and provider callbacks stay unavailable until a trusted
  // provider and the target database contract are verified. Keep this
  // repository read-only so stale, schema-incompatible write paths cannot be
  // activated accidentally.
  async getPayments(limit: number, offset: number) {
    const res = await this.pool.query(
      'SELECT * FROM payments ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset],
    );
    return res.rows;
  }

  async getPaymentById(id: string) {
    const res = await this.pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    return res.rows[0];
  }

  async getStats() {
    const res = await this.pool.query(
      "SELECT SUM(amount) as total_revenue, COUNT(*) as total_payments FROM payments WHERE status = 'PAID'",
    );
    return res.rows[0];
  }
}
