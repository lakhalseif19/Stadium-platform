import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { TeamsRepository } from './teams.repository';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    private readonly repository: TeamsRepository,
  ) {}

  async createTeam(dto: CreateTeamDto) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const team = await this.repository.create(
        {
          name: dto.name,
          sessions_per_week: dto.sessions_per_week,
          starts_on: dto.starts_on,
          ends_on: dto.ends_on,
        },
        client,
      );

      await client.query('COMMIT');
      return team;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
