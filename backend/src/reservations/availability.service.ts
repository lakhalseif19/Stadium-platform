import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class AvailabilityService {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async getAvailability(fieldId: string, date: string) {
    const fieldResult = await this.pool.query(
      `SELECT opens_at, closes_at,
              ($2::date::timestamp AT TIME ZONE 'Africa/Algiers') AS day_start
       FROM fields WHERE id = $1 AND is_active = true`,
      [fieldId, date],
    );
    if (!fieldResult.rowCount) return [];

    const result = await this.pool.query(
      `SELECT starts_at, ends_at
       FROM reservations
       WHERE field_id = $1
         AND starts_at < (($2::date + 1)::timestamp AT TIME ZONE 'Africa/Algiers')
         AND ends_at > ($2::date::timestamp AT TIME ZONE 'Africa/Algiers')
         AND status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN')`,
      [fieldId, date],
    );
    const open = String(fieldResult.rows[0].opens_at).slice(0, 5);
    const close = String(fieldResult.rows[0].closes_at).slice(0, 5);
    const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
    const startMinutes = minutes(open);
    const endMinutes = minutes(close);
    const bookings = result.rows.map((row) => ({
      start: new Date(row.starts_at).getTime(),
      end: new Date(row.ends_at).getTime(),
    }));
    const dayStart = new Date(fieldResult.rows[0].day_start).getTime();
    const now = Date.now();
    const slots = [];
    for (let start = startMinutes; start + 60 <= endMinutes; start += 60) {
      const startTime = `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`;
      const end = start + 60;
      const endTime = `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
      const slotStart = dayStart + start * 60_000;
      const slotEnd = dayStart + end * 60_000;
      slots.push({
        startTime,
        endTime,
        isAvailable:
          slotStart > now &&
          !bookings.some((booking) => slotStart < booking.end && slotEnd > booking.start),
      });
    }
    return slots;
  }
}
