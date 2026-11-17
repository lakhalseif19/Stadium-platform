import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_POOL } from '../database/database.module';
import { Pool } from 'pg';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  async findAll(limit: number, offset: number) {
    const res = await this.pool.query(
      `SELECT
         u.id,
         u.phone,
         u.email,
         u.first_name,
         u.last_name,
         u.is_active,
         (u.phone_verified_at IS NOT NULL) AS phone_verified,
         COALESCE(
           array_agg(DISTINCT r.name)
             FILTER (WHERE r.name IS NOT NULL),
           '{}'
         ) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const countRes = await this.pool.query('SELECT COUNT(*) FROM users');

    return {
      data: res.rows,
      total: parseInt(countRes.rows[0].count, 10),
    };
  }

  async findById(id: string) {
    const res = await this.pool.query(
      `SELECT
         id,
         phone,
         email,
         first_name,
         last_name,
         is_active,
         (phone_verified_at IS NOT NULL) AS phone_verified
       FROM users
       WHERE id = $1`,
      [id],
    );

    return res.rows[0];
  }

  async create(data: CreateUserDto, passwordHash: string) {
    const res = await this.pool.query(
      `INSERT INTO users (
         phone,
         email,
         password_hash,
         first_name,
         last_name
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
         id,
         phone,
         email,
         first_name,
         last_name,
         is_active,
         (phone_verified_at IS NOT NULL) AS phone_verified`,
      [data.phone || null, data.email || null, passwordHash, data.first_name, data.last_name],
    );

    return res.rows[0];
  }

  async update(id: string, data: UpdateUserDto) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(value);
      }
    }

    if (!fields.length) {
      return this.findById(id);
    }

    values.push(id);

    const res = await this.pool.query(
      `UPDATE users
       SET ${fields.join(', ')}
       WHERE id = $${idx}
       RETURNING
         id,
         phone,
         email,
         first_name,
         last_name,
         is_active,
         (phone_verified_at IS NOT NULL) AS phone_verified`,
      values,
    );

    return res.rows[0];
  }

  async toggleActive(id: string) {
    const res = await this.pool.query(
      `UPDATE users
       SET is_active = NOT is_active
       WHERE id = $1
       RETURNING id, is_active`,
      [id],
    );

    return res.rows[0];
  }
}
