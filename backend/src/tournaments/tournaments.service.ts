import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { TournamentsRepository } from './tournaments.repository';
import { CreateTournamentDto } from './dto/create-tournament.dto';

@Injectable()
export class TournamentsService {
  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    private readonly repository: TournamentsRepository,
  ) {}

  async createTournament(dto: CreateTournamentDto) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const tournament = await this.repository.create(
        {
          name: dto.name,
          description: dto.description,
          starts_on: dto.starts_on,
          ends_on: dto.ends_on,
        },
        client,
      );

      await client.query('COMMIT');
      return tournament;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
