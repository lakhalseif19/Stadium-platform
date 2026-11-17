import { Injectable, Inject } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { Pool } from 'pg';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';
import { NotFoundException, BadRequestException } from '../common/exceptions';
import { SeasonStatus } from '../common/enums';

@Injectable()
export class SeasonsService {
  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    private readonly auditService: AuditService,
  ) {}

  private validateDates(start: string, end: string) {
    if (new Date(start) >= new Date(end))
      throw new BadRequestException('starts_on must be before ends_on');
  }

  async create(dto: CreateSeasonDto, userId: string, ipAddress?: string) {
    this.validateDates(dto.starts_on, dto.ends_on);
    if (dto.status === SeasonStatus.ACTIVE) {
      await this.pool.query('UPDATE seasons SET status = $1 WHERE status = $2', [
        SeasonStatus.CLOSED,
        SeasonStatus.ACTIVE,
      ]);
    }
    const query =
      'INSERT INTO seasons (name, starts_on, ends_on, status) VALUES ($1, $2, $3, $4) RETURNING *';
    const res = await this.pool.query(query, [dto.name, dto.starts_on, dto.ends_on, dto.status]);
    const season = res.rows[0];
    await this.auditService.log(userId, 'CREATE', 'SEASON', season.id, null, season, ipAddress);
    return season;
  }

  async findAll() {
    const res = await this.pool.query('SELECT * FROM seasons ORDER BY starts_on DESC');
    return res.rows;
  }

  async findById(id: string) {
    const res = await this.pool.query('SELECT * FROM seasons WHERE id = $1', [id]);
    if (!res.rows[0]) throw new NotFoundException('Season not found');
    return res.rows[0];
  }

  async getActiveSeason() {
    const res = await this.pool.query('SELECT * FROM seasons WHERE status = $1 LIMIT 1', [
      SeasonStatus.ACTIVE,
    ]);
    return res.rows[0] || null;
  }

  async update(id: string, dto: UpdateSeasonDto, userId: string, ipAddress?: string) {
    const oldSeason = await this.findById(id);
    const starts_on = dto.starts_on || oldSeason.starts_on;
    const ends_on = dto.ends_on || oldSeason.ends_on;
    this.validateDates(starts_on, ends_on);

    if (dto.status === SeasonStatus.ACTIVE && oldSeason.status !== SeasonStatus.ACTIVE) {
      await this.pool.query('UPDATE seasons SET status = $1 WHERE status = $2', [
        SeasonStatus.CLOSED,
        SeasonStatus.ACTIVE,
      ]);
    }

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
    if (setClauses.length === 0) return oldSeason;
    values.push(id);
    const query = `UPDATE seasons SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`;
    const res = await this.pool.query(query, values);
    const season = res.rows[0];
    await this.auditService.log(
      userId,
      'UPDATE',
      'SEASON',
      season.id,
      oldSeason,
      season,
      ipAddress,
    );
    return season;
  }
}
