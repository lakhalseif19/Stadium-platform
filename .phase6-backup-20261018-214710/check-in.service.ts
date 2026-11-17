import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class CheckInService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('DATABASE_POOL') private readonly pool: Pool,
  ) {}

  async generateQr(userId: string, reservationId: string) {
    const res = await this.pool.query(
      'SELECT field_id FROM reservations WHERE id = $1 AND user_id = $2',
      [reservationId, userId],
    );
    if (res.rows.length === 0) {
      throw new BadRequestException('RESERVATION_NOT_FOUND');
    }
    const fieldId = res.rows[0].field_id;

    const payload = { sub: reservationId, uid: userId, fid: fieldId };
    const secret = this.configService.get<string>('jwt.qrSecret');

    const token = this.jwtService.sign(payload, { secret, expiresIn: '5m' });
    return { token };
  }

  async scanQr(guardId: string, token: string) {
    const secret = this.configService.get<string>('jwt.qrSecret');
    let payload;
    try {
      payload = this.jwtService.verify(token, { secret });
    } catch {
      throw new BadRequestException('INVALID_QR');
    }

    const reservationId = payload.sub;

    const res = await this.pool.query(
      'SELECT r.*, p.status as payment_status FROM reservations r LEFT JOIN payments p ON p.reservation_id = r.id WHERE r.id = $1',
      [reservationId],
    );
    if (res.rows.length === 0) {
      throw new BadRequestException('RESERVATION_NOT_FOUND');
    }

    const reservation = res.rows[0];

    if (reservation.status === 'CHECKED_IN') throw new BadRequestException('QR_ALREADY_USED');
    if (reservation.status !== 'CONFIRMED')
      throw new BadRequestException('RESERVATION_NOT_CONFIRMED');
    if (reservation.payment_status !== 'PAID') throw new BadRequestException('PAYMENT_PENDING');

    const now = new Date();
    const startTime = new Date(reservation.starts_at);
    const endTime = new Date(reservation.ends_at);
    startTime.setMinutes(startTime.getMinutes() - 15);

    if (now < startTime || now > endTime) throw new BadRequestException('INVALID_TIME');

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const updateRes = await client.query(
        'UPDATE reservations SET status = $1, checked_in_at = NOW(), checked_in_by = $2 WHERE id = $3 AND status = $4 RETURNING checked_in_at',
        ['CHECKED_IN', guardId, reservationId, 'CONFIRMED'],
      );

      if (updateRes.rowCount === 0) throw new BadRequestException('QR_ALREADY_USED');

      await client.query('COMMIT');

      return {
        reservation_id: reservationId,
        status: 'CHECKED_IN',
        checked_in_at: updateRes.rows[0].checked_in_at,
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
