import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_POOL } from '../database/database.module';
import { Pool } from 'pg';

@Injectable()
export class AuditRepository {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  async log(
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    oldValues: any,
    newValues: any,
    ipAddress: string | null,
  ) {
    await this.pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, entityType, entityId, oldValues, newValues, ipAddress],
    );
  }

  async findAll(limit: number, offset: number) {
    const res = await this.pool.query(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset],
    );
    const countRes = await this.pool.query('SELECT COUNT(*) FROM audit_logs');
    return { data: res.rows, total: parseInt(countRes.rows[0].count) };
  }
}
