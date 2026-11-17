import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateStadiumDto } from './dto/create-stadium.dto';
import { UpdateStadiumDto } from './dto/update-stadium.dto';
import { SearchStadiumsDto } from './dto/search-stadiums.dto';

@Injectable()
export class StadiumsRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async create(dto: CreateStadiumDto) {
    const query = `
      INSERT INTO stadiums (name_ar, name_fr, name_en, address, commune_id, location, is_active)
      VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326), true)
      RETURNING id, name_ar, name_fr, name_en, address, commune_id, ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude, is_active, created_at, updated_at
    `;
    const values = [
      dto.name_ar,
      dto.name_fr,
      dto.name_en,
      dto.address,
      dto.commune_id,
      dto.longitude,
      dto.latitude,
    ];
    const res = await this.pool.query(query, values);
    return res.rows[0];
  }

  async findAll(searchDto: SearchStadiumsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      commune_id,
      latitude,
      longitude,
      radius_km = 10,
    } = searchDto;
    const offset = (page - 1) * limit;
    const values: any[] = [];
    const whereClauses: string[] = [];

    if (search) {
      values.push(`%${search}%`);
      whereClauses.push(
        `(s.name_ar ILIKE $${values.length} OR s.name_fr ILIKE $${values.length} OR s.name_en ILIKE $${values.length})`,
      );
    }

    if (commune_id) {
      values.push(commune_id);
      whereClauses.push(`s.commune_id = $${values.length}`);
    }

    if (latitude && longitude) {
      values.push(longitude, latitude, radius_km * 1000);
      whereClauses.push(
        `ST_DWithin(s.location, ST_SetSRID(ST_MakePoint($${values.length - 2}, $${values.length - 1}), 4326)::geography, $${values.length})`,
      );
    }

    const whereString = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const countQuery = `SELECT COUNT(*) FROM stadiums s ${whereString}`;
    const dataQuery = `
      SELECT s.id, s.name_ar, s.name_fr, s.name_en, s.address, s.commune_id,
             c.name_fr AS commune_name, COUNT(f.id)::int AS fields_count,
             ST_Y(s.location::geometry) as latitude, ST_X(s.location::geometry) as longitude,
             s.is_active, s.created_at, s.updated_at
      FROM stadiums s
      LEFT JOIN communes c ON c.id = s.commune_id
      LEFT JOIN fields f ON f.stadium_id = s.id
      ${whereString}
      GROUP BY s.id, c.name_fr
      ORDER BY s.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const [countRes, dataRes] = await Promise.all([
      this.pool.query(countQuery, values),
      this.pool.query(dataQuery, [...values, limit, offset]),
    ]);

    return {
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count, 10),
      page,
      limit,
    };
  }

  async findById(id: string) {
    const query = `
      SELECT id, name_ar, name_fr, name_en, address, commune_id, ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude, is_active, created_at, updated_at
      FROM stadiums
      WHERE id = $1
    `;
    const res = await this.pool.query(query, [id]);
    return res.rows[0];
  }

  async update(id: string, dto: UpdateStadiumDto) {
    const setClauses: string[] = [];
    const values: any[] = [];
    let index = 1;

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        if (key === 'latitude' || key === 'longitude') continue;
        setClauses.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }
    }

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      setClauses.push(`location = ST_SetSRID(ST_MakePoint($${index}, $${index + 1}), 4326)`);
      values.push(dto.longitude, dto.latitude);
      index += 2;
    }

    if (setClauses.length === 0) return this.findById(id);

    values.push(id);
    const query = `
      UPDATE stadiums
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${index}
      RETURNING id, name_ar, name_fr, name_en, address, commune_id, ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude, is_active, created_at, updated_at
    `;

    const res = await this.pool.query(query, values);
    return res.rows[0];
  }

  async toggleActive(id: string) {
    const query = `
      UPDATE stadiums
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1
      RETURNING id, is_active
    `;
    const res = await this.pool.query(query, [id]);
    return res.rows[0];
  }
}
