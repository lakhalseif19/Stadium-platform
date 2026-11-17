import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { ClosuresRepository } from './closures.repository';
import { CreateClosureDto } from './dto/create-closure.dto';

@Injectable()
export class ClosuresService {
  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    private readonly repository: ClosuresRepository,
  ) {}

  async createClosure(dto: CreateClosureDto) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const closure = await this.repository.create(
        {
          field_id: dto.field_id,
          reason: dto.reason,
          reason_details: dto.reason_details,
          starts_at: dto.starts_at,
          ends_at: dto.ends_at,
        },
        client,
      );

      await client.query('COMMIT');
      return closure;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async listClosures() {
    return this.repository.list();
  }
}
