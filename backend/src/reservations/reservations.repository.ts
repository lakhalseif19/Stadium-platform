import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class ReservationsRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async findByUser(userId: string) {
    const result = await this.pool.query(
      `SELECT r.*, f.name_fr AS field_name, s.name_fr AS stadium_name,
              COALESCE(u.first_name || ' ' || u.last_name, '') AS user_name
       FROM reservations r
       JOIN fields f ON f.id = r.field_id
       JOIN stadiums s ON s.id = f.stadium_id
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.user_id = $1
       ORDER BY r.starts_at DESC`,
      [userId],
    );
    return result.rows;
  }

  async findAll() {
    const result = await this.pool.query(
      `SELECT r.*, f.name_fr AS field_name, s.name_fr AS stadium_name,
              COALESCE(u.first_name || ' ' || u.last_name, '') AS user_name
       FROM reservations r
       JOIN fields f ON f.id = r.field_id
       JOIN stadiums s ON s.id = f.stadium_id
       LEFT JOIN users u ON u.id = r.user_id
       ORDER BY r.starts_at DESC
       LIMIT 500`,
    );
    return result.rows;
  }

  async create(data: any, client: any = this.pool) {
    const res = await client.query(
      `INSERT INTO reservations (field_id, user_id, starts_at, ends_at, coverage, type, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        data.field_id,
        data.user_id,
        data.starts_at,
        data.ends_at,
        data.coverage,
        data.type,
        data.status,
        data.expires_at,
      ],
    );
    return res.rows[0];
  }
}
