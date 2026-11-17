import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { ReservationsRepository } from './reservations.repository';
import { CreateReservationDto } from './dto/create-reservation.dto';
import {
  BusinessException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '../common/exceptions';
import { ReservationType } from '../common/enums';

@Injectable()
export class ReservationsService {
  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    private readonly repository: ReservationsRepository,
  ) {}

  findForUser(userId: string) {
    return this.repository.findByUser(userId);
  }

  findAllForAdmin() {
    return this.repository.findAll();
  }

  async createReservation(dto: CreateReservationDto, userId: string, isAdmin: boolean) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const start = new Date(dto.starts_at);
      if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) {
        throw new BusinessException('Reservation start must be a valid future date.');
      }
      if (start.getUTCMonth() === 7 && !isAdmin) {
        throw new BusinessException('August is reserved for admin operations.');
      }
      if (dto.user_id && dto.user_id !== userId && !isAdmin) {
        throw new ForbiddenException('You cannot create a reservation for another user.');
      }
      const endsAt = new Date(start.getTime() + 60 * 60 * 1000);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const res = await this.repository.create(
        {
          field_id: dto.field_id,
          user_id: isAdmin && dto.user_id ? dto.user_id : userId,
          starts_at: start,
          ends_at: endsAt,
          coverage: dto.coverage,
          type: ReservationType.SINGLE,
          status: 'PENDING_PAYMENT',
          expires_at: expiresAt,
        },
        client,
      );

      await client.query('COMMIT');
      return res;
    } catch (e) {
      await client.query('ROLLBACK');
      if ((e as any)?.code === '23P01' || (e as any)?.code === '23505') {
        throw new ConflictException('The selected time slot is no longer available.');
      }
      throw e;
    } finally {
      client.release();
    }
  }

  async cancelReservation(id: string, userId: string) {
    const result = await this.pool.query(
      `UPDATE reservations
       SET status = 'CANCELLED', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status IN ('PENDING_PAYMENT', 'CONFIRMED')
         AND starts_at > NOW()
       RETURNING *`,
      [id, userId],
    );
    if (result.rowCount) return result.rows[0];
    const existing = await this.pool.query(
      'SELECT id FROM reservations WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    if (!existing.rowCount) throw new NotFoundException('Reservation not found.');
    throw new ConflictException('This reservation can no longer be cancelled.');
  }
}
