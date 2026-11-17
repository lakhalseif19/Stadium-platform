import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';

@Injectable()
export class FieldsRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async create(dto: CreateFieldDto) {
    const query = `
      INSERT INTO fields (stadium_id, name_ar, name_fr, name_en, booking_mode, opens_at, closes_at, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *
    `;
    const res = await this.pool.query(query, [
      dto.stadium_id,
      dto.name_ar,
      dto.name_fr,
      dto.name_en,
      dto.booking_mode,
      dto.opens_at,
      dto.closes_at,
    ]);
    return res.rows[0];
  }

  async findByStadium(stadium_id: string) {
    const query = 'SELECT * FROM fields WHERE stadium_id = $1 ORDER BY created_at DESC';
    const res = await this.pool.query(query, [stadium_id]);
    return res.rows;
  }

  async findById(id: string) {
    const query = 'SELECT * FROM fields WHERE id = $1';
    const res = await this.pool.query(query, [id]);
    return res.rows[0];
  }

  async update(id: string, dto: UpdateFieldDto) {
    const setClauses: string[] = [];
    const values: any[] = [];
    let index = 1;
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        setClauses.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }
    }
    if (setClauses.length === 0) return this.findById(id);
    values.push(id);
    const query = `UPDATE fields SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`;
    const res = await this.pool.query(query, values);
    return res.rows[0];
  }

  async toggleActive(id: string) {
    const res = await this.pool.query(
      'UPDATE fields SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id],
    );
    return res.rows[0];
  }
}
