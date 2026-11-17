import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { CheckInService } from '../src/check-in/check-in.service';

const databaseUrl = process.env.STADIUM_TEST_DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;

suite('check-in row locking (isolated PostgreSQL)', () => {
  let pool: Pool;
  let fieldId: string;
  let userId: string;
  let guardId: string;
  let service: CheckInService;

  beforeAll(async () => {
    const parsed = new URL(databaseUrl!);
    if (!['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname)) {
      throw new Error('Integration tests only accept a loopback PostgreSQL host.');
    }
    if (!parsed.pathname.slice(1).startsWith('stadium_phase3_test')) {
      throw new Error('Integration tests require a database named stadium_phase3_test*.');
    }

    pool = new Pool({ connectionString: databaseUrl, max: 5 });
    const identity = await pool.query<{ database_name: string }>(
      'SELECT current_database() AS database_name',
    );
    if (!identity.rows[0]?.database_name.startsWith('stadium_phase3_test')) {
      throw new Error('Refusing to run against an unexpected PostgreSQL database.');
    }

    const wilayaId = randomUUID();
    const communeId = randomUUID();
    const stadiumId = randomUUID();
    fieldId = randomUUID();
    userId = randomUUID();
    guardId = randomUUID();
    await pool.query(
      'INSERT INTO wilayas (id, code, name_fr, name_ar, name_en) VALUES ($1, $2, $3, $4, $5)',
      [wilayaId, Math.floor(Math.random() * 1000000000), `CI ${wilayaId}`, 'CI', 'CI'],
    );
    await pool.query(
      'INSERT INTO communes (id, wilaya_id, name_fr, name_ar, name_en) VALUES ($1, $2, $3, $4, $5)',
      [communeId, wilayaId, `CI ${communeId}`, 'CI', 'CI'],
    );
    await pool.query(
      'INSERT INTO stadiums (id, commune_id, name_fr, name_ar, name_en) VALUES ($1, $2, $3, $4, $5)',
      [stadiumId, communeId, `CI ${stadiumId}`, 'CI', 'CI'],
    );
    await pool.query(
      "INSERT INTO fields (id, stadium_id, booking_mode) VALUES ($1, $2, 'FULL_ONLY')",
      [fieldId, stadiumId],
    );
    await pool.query('INSERT INTO users (id, phone) VALUES ($1, $2), ($3, $4)', [
      userId,
      `+213${Date.now()}1`,
      guardId,
      `+213${Date.now()}2`,
    ]);

    service = new CheckInService(
      { verifyAsync: jest.fn() } as any,
      { get: jest.fn().mockReturnValue('isolated-test-qr-secret') } as any,
      pool,
    );
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('allows only one of two simultaneous scans to check in a paid reservation', async () => {
    const reservationId = randomUUID();
    await pool.query(
      `INSERT INTO reservations (id, field_id, user_id, type, coverage, starts_at, ends_at, status)
       VALUES ($1, $2, $3, 'SINGLE', 'FULL', NOW() - INTERVAL '10 minutes',
               NOW() + INTERVAL '50 minutes', 'CONFIRMED')`,
      [reservationId, fieldId, userId],
    );
    await pool.query(
      `INSERT INTO payments (reservation_id, amount, currency, status)
       VALUES ($1, 1000, 'DZD', 'PAID')`,
      [reservationId],
    );
    const qrPayload = { sub: reservationId, uid: userId, fid: fieldId };
    const verifyAsync = jest.fn().mockResolvedValue(qrPayload);
    service = new CheckInService(
      { verifyAsync } as any,
      { get: jest.fn().mockReturnValue('isolated-test-qr-secret') } as any,
      pool,
    );

    const results = await Promise.allSettled([
      service.scanQr(guardId, 'signed-test-token-a'),
      service.scanQr(guardId, 'signed-test-token-b'),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const persisted = await pool.query(
      'SELECT status, checked_in_by FROM reservations WHERE id = $1',
      [reservationId],
    );
    expect(persisted.rows[0]).toMatchObject({ status: 'CHECKED_IN', checked_in_by: guardId });
    const audit = await pool.query(
      "SELECT count(*)::int AS count FROM audit_logs WHERE entity_id = $1 AND action = 'CHECK_IN'",
      [reservationId],
    );
    expect(audit.rows[0].count).toBe(1);
  });
});
