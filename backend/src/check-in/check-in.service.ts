import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

interface ReservationQrPayload {
  sub: string;
  uid: string;
  fid: string;
}

@Injectable()
export class CheckInService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('DATABASE_POOL') private readonly pool: Pool,
  ) {}

  async generateQr(userId: string, reservationId: string) {
    const res = await this.pool.query(
      `SELECT r.field_id
       FROM reservations r
       LEFT JOIN subscriptions s ON s.id = r.subscription_id
       WHERE r.id = $1
         AND (r.user_id = $2 OR s.user_id = $2)
         AND r.status = 'CONFIRMED'
         AND (
           (r.subscription_id IS NULL AND EXISTS (
             SELECT 1 FROM payments p
             WHERE p.reservation_id = r.id AND p.status = 'PAID'
           )) OR
           (r.subscription_id IS NOT NULL AND EXISTS (
             SELECT 1 FROM subscriptions active_s
             JOIN payments p ON p.subscription_id = active_s.id AND p.status = 'PAID'
             WHERE active_s.id = r.subscription_id AND active_s.status = 'ACTIVE'
           ))
         )`,
      [reservationId, userId],
    );
    if (res.rows.length === 0) {
      throw new BadRequestException('RESERVATION_NOT_ELIGIBLE_FOR_QR');
    }

    const secret = this.configService.get<string>('jwt.qrSecret');
    if (!secret) {
      throw new ServiceUnavailableException('QR verification is not configured');
    }

    const token = this.jwtService.sign(
      { sub: reservationId, uid: userId, fid: res.rows[0].field_id },
      { secret, expiresIn: '5m' },
    );
    return { token };
  }

  async scanQr(guardId: string, token: string) {
    const secret = this.configService.get<string>('jwt.qrSecret');
    if (!secret) {
      throw new ServiceUnavailableException('QR verification is not configured');
    }

    let payload: ReservationQrPayload;
    try {
      const verified = await this.jwtService.verifyAsync<ReservationQrPayload>(token, {
        secret,
      });
      if (
        typeof verified.sub !== 'string' ||
        typeof verified.uid !== 'string' ||
        typeof verified.fid !== 'string'
      ) {
        throw new Error('QR claims are incomplete');
      }
      payload = verified;
    } catch {
      throw new BadRequestException('INVALID_QR');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `SELECT r.id, COALESCE(r.user_id, s.user_id) AS owner_id,
                r.field_id, r.status, r.starts_at, r.ends_at,
                f.stadium_id,
                CASE
                  WHEN r.subscription_id IS NULL THEN EXISTS (
                    SELECT 1 FROM payments p
                    WHERE p.reservation_id = r.id AND p.status = 'PAID'
                  )
                  ELSE EXISTS (
                    SELECT 1
                    FROM subscriptions s
                    JOIN payments p ON p.subscription_id = s.id AND p.status = 'PAID'
                    WHERE s.id = r.subscription_id AND s.status = 'ACTIVE'
                  )
                END AS payment_confirmed
         FROM reservations r
         JOIN fields f ON f.id = r.field_id
         LEFT JOIN subscriptions s ON s.id = r.subscription_id
         WHERE r.id = $1
         FOR UPDATE OF r`,
        [payload.sub],
      );

      if (result.rows.length === 0) {
        throw new BadRequestException('RESERVATION_NOT_FOUND');
      }

      const reservation = result.rows[0];
      if (reservation.owner_id !== payload.uid || reservation.field_id !== payload.fid) {
        throw new BadRequestException('INVALID_QR');
      }
      if (reservation.status === 'CHECKED_IN') {
        throw new BadRequestException('QR_ALREADY_USED');
      }
      if (reservation.status !== 'CONFIRMED') {
        throw new BadRequestException('RESERVATION_NOT_CONFIRMED');
      }
      if (!reservation.payment_confirmed) {
        throw new BadRequestException('PAYMENT_PENDING');
      }

      const now = Date.now();
      const startsAt = new Date(reservation.starts_at).getTime() - 15 * 60 * 1000;
      const endsAt = new Date(reservation.ends_at).getTime();
      if (now < startsAt || now > endsAt) {
        throw new BadRequestException('INVALID_TIME');
      }

      const update = await client.query(
        `UPDATE reservations
         SET status = 'CHECKED_IN', checked_in_at = NOW(), checked_in_by = $1
         WHERE id = $2 AND status = 'CONFIRMED'
         RETURNING checked_in_at`,
        [guardId, reservation.id],
      );
      if (update.rowCount !== 1) {
        throw new BadRequestException('QR_ALREADY_USED');
      }

      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
         VALUES ($1, 'CHECK_IN', 'reservation', $2, $3::jsonb, $4::jsonb)`,
        [
          guardId,
          reservation.id,
          JSON.stringify({ status: 'CONFIRMED' }),
          JSON.stringify({ status: 'CHECKED_IN', checked_in_by: guardId }),
        ],
      );

      await client.query('COMMIT');
      return {
        reservation_id: reservation.id,
        status: 'CHECKED_IN',
        checked_in_at: update.rows[0].checked_in_at,
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Preserve the original transaction error.
      }
      throw error;
    } finally {
      client.release();
    }
  }
}
