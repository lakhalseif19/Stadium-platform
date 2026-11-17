import { Injectable, Inject } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { Pool } from 'pg';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { NotFoundException } from '../common/exceptions';

@Injectable()
export class PricingService {
  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreatePricingDto, userId: string, ipAddress?: string) {
    const query =
      'INSERT INTO pricing_plans (field_id, season_id, coverage, duration_type, amount) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const res = await this.pool.query(query, [
      dto.field_id,
      dto.season_id,
      dto.coverage,
      dto.duration_type,
      dto.amount,
    ]);
    const pricing = res.rows[0];
    await this.auditService.log(userId, 'CREATE', 'PRICING', pricing.id, null, pricing, ipAddress);
    return pricing;
  }

  async findByFilter(field_id?: string, season_id?: string) {
    const values: any[] = [];
    const whereClauses: string[] = [];
    if (field_id) {
      values.push(field_id);
      whereClauses.push(`field_id = $${values.length}`);
    }
    if (season_id) {
      values.push(season_id);
      whereClauses.push(`season_id = $${values.length}`);
    }
    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const query = `SELECT p.*, f.name_fr AS field_name, s.name AS season_name, s.status AS season_status
                   FROM pricing_plans p
                   JOIN fields f ON f.id = p.field_id
                   JOIN seasons s ON s.id = p.season_id
                   ${where.replace(/\bfield_id\b/g, 'p.field_id').replace(/\bseason_id\b/g, 'p.season_id')}
                   ORDER BY p.created_at DESC`;
    const res = await this.pool.query(query, values);
    return res.rows;
  }

  async findById(id: string) {
    const res = await this.pool.query('SELECT * FROM pricing_plans WHERE id = $1', [id]);
    if (!res.rows[0]) throw new NotFoundException('Pricing not found');
    return res.rows[0];
  }

  async update(id: string, dto: UpdatePricingDto, userId: string, ipAddress?: string) {
    const oldPricing = await this.findById(id);
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
    if (setClauses.length === 0) return oldPricing;
    values.push(id);
    const query = `UPDATE pricing_plans SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`;
    const res = await this.pool.query(query, values);
    const pricing = res.rows[0];
    await this.auditService.log(
      userId,
      'UPDATE',
      'PRICING',
      pricing.id,
      oldPricing,
      pricing,
      ipAddress,
    );
    return pricing;
  }

  async delete(id: string, userId: string, ipAddress?: string) {
    const pricing = await this.findById(id);
    await this.pool.query('DELETE FROM pricing_plans WHERE id = $1', [id]);
    await this.auditService.log(userId, 'DELETE', 'PRICING', id, pricing, null, ipAddress);
    return { success: true };
  }
}
