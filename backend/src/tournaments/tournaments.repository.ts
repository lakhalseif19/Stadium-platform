import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class TournamentsRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async create(data: any, client: any = this.pool) {
    const res = await client.query(
      `INSERT INTO tournaments (name, description, starts_on, ends_on)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.name, data.description, data.starts_on, data.ends_on],
    );
    return res.rows[0];
  }
}
