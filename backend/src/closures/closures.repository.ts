import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class ClosuresRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async create(data: any, client: any = this.pool) {
    const res = await client.query(
      `INSERT INTO closures (field_id, reason, reason_details, starts_at, ends_at, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.field_id, data.reason, data.reason_details, data.starts_at, data.ends_at, data.status],
    );
    return res.rows[0];
  }

  async list() {
    const res = await this.pool.query(
      `SELECT c.*, f.name_fr AS field_name, s.name_fr AS stadium_name
       FROM closures c
       JOIN fields f ON f.id = c.field_id
       JOIN stadiums s ON s.id = f.stadium_id
       ORDER BY c.starts_at DESC`,
    );
    return res.rows;
  }
}
