import { Injectable, Inject } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { Pool } from 'pg';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { NotFoundException } from '../common/exceptions';

@Injectable()
export class StadiumMediaService {
  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateMediaDto, userId: string, ipAddress?: string) {
    if (dto.is_primary) {
      await this.pool.query('UPDATE stadium_media SET is_primary = false WHERE stadium_id = $1', [
        dto.stadium_id,
      ]);
    }
    const query =
      'INSERT INTO stadium_media (stadium_id, file_url, mime_type, is_primary, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const res = await this.pool.query(query, [
      dto.stadium_id,
      dto.file_url,
      dto.mime_type,
      dto.is_primary,
      dto.sort_order,
    ]);
    const media = res.rows[0];
    await this.auditService.log(
      userId,
      'CREATE',
      'STADIUM_MEDIA',
      media.id,
      null,
      media,
      ipAddress,
    );
    return media;
  }

  async findByStadium(stadium_id: string) {
    const query =
      'SELECT * FROM stadium_media WHERE stadium_id = $1 ORDER BY sort_order ASC, created_at DESC';
    const res = await this.pool.query(query, [stadium_id]);
    return res.rows;
  }

  async findById(id: string) {
    const res = await this.pool.query('SELECT * FROM stadium_media WHERE id = $1', [id]);
    if (!res.rows[0]) throw new NotFoundException('Media not found');
    return res.rows[0];
  }

  async update(id: string, dto: UpdateMediaDto, userId: string, ipAddress?: string) {
    const oldMedia = await this.findById(id);
    if (dto.is_primary && !oldMedia.is_primary) {
      await this.pool.query('UPDATE stadium_media SET is_primary = false WHERE stadium_id = $1', [
        oldMedia.stadium_id,
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
    if (setClauses.length === 0) return oldMedia;
    values.push(id);
    const query = `UPDATE stadium_media SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`;
    const res = await this.pool.query(query, values);
    const media = res.rows[0];
    await this.auditService.log(
      userId,
      'UPDATE',
      'STADIUM_MEDIA',
      media.id,
      oldMedia,
      media,
      ipAddress,
    );
    return media;
  }

  async setPrimary(id: string, userId: string, ipAddress?: string) {
    const media = await this.findById(id);
    await this.pool.query('UPDATE stadium_media SET is_primary = false WHERE stadium_id = $1', [
      media.stadium_id,
    ]);
    const res = await this.pool.query(
      'UPDATE stadium_media SET is_primary = true, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id],
    );
    const updatedMedia = res.rows[0];
    await this.auditService.log(
      userId,
      'SET_PRIMARY',
      'STADIUM_MEDIA',
      updatedMedia.id,
      { is_primary: false },
      { is_primary: true },
      ipAddress,
    );
    return updatedMedia;
  }

  async delete(id: string, userId: string, ipAddress?: string) {
    const media = await this.findById(id);
    await this.pool.query('DELETE FROM stadium_media WHERE id = $1', [id]);
    await this.auditService.log(userId, 'DELETE', 'STADIUM_MEDIA', id, media, null, ipAddress);
    return { success: true };
  }
}
