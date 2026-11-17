import { Pool, PoolClient } from 'pg';
import { randomUUID } from 'crypto';

const databaseUrl = process.env.STADIUM_TEST_DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;

suite('reservation exclusion constraint (isolated PostgreSQL)', () => {
  let pool: Pool;
  let fieldId: string;
  let userId: string;

  beforeAll(async () => {
    const parsed = new URL(databaseUrl!);
    if (!['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname)) {
      throw new Error('Integration tests only accept a loopback PostgreSQL host.');
    }
    if (!parsed.pathname.slice(1).startsWith('stadium_phase3_test')) {
      throw new Error('Integration tests require a database named stadium_phase3_test*.');
    }

    pool = new Pool({ connectionString: databaseUrl, max: 4 });
    const identity = await pool.query<{ database_name: string; address: string | null }>(
      'SELECT current_database() AS database_name, inet_server_addr()::text AS address',
    );
    if (!identity.rows[0]?.database_name.startsWith('stadium_phase3_test')) {
      throw new Error('Refusing to run against an unexpected PostgreSQL database.');
    }

    const constraint = await pool.query(
      `SELECT 1 FROM pg_constraint
       WHERE contype = 'x' AND conrelid = 'reservations'::regclass
         AND pg_get_constraintdef(oid) ILIKE '%coverage_to_array%'`,
    );
    if (!constraint.rowCount) {
      throw new Error('Checked schema reservation exclusion constraint is not installed.');
    }

    const wilayaId = randomUUID();
    const communeId = randomUUID();
    const stadiumId = randomUUID();
    fieldId = randomUUID();
    userId = randomUUID();
    await pool.query(
      'INSERT INTO wilayas (id, code, name_fr, name_ar, name_en) VALUES ($1, $2, $3, $4, $5)',
      [
        wilayaId,
        Math.floor(Math.random() * 1000000000),
        `Integration ${wilayaId}`,
        'Integration',
        'Integration',
      ],
    );
    await pool.query(
      'INSERT INTO communes (id, wilaya_id, name_fr, name_ar, name_en) VALUES ($1, $2, $3, $4, $5)',
      [communeId, wilayaId, `Integration ${communeId}`, 'Integration', 'Integration'],
    );
    await pool.query(
      'INSERT INTO stadiums (id, commune_id, name_fr, name_ar, name_en) VALUES ($1, $2, $3, $4, $5)',
      [stadiumId, communeId, `Integration ${stadiumId}`, 'Integration', 'Integration'],
    );
    await pool.query(
      "INSERT INTO fields (id, stadium_id, booking_mode) VALUES ($1, $2, 'FULL_ONLY')",
      [fieldId, stadiumId],
    );
    await pool.query('INSERT INTO users (id, phone) VALUES ($1, $2)', [
      userId,
      `+213${Date.now()}`,
    ]);
  });

  afterAll(async () => {
    await pool?.end();
  });

  async function insertReservation(
    client: Pool | PoolClient,
    startsAt: string,
    endsAt: string,
    status = 'PENDING_PAYMENT',
  ) {
    return client.query(
      `INSERT INTO reservations (field_id, user_id, type, coverage, starts_at, ends_at, status)
       VALUES ($1, $2, 'SINGLE', 'FULL', $3, $4, $5)`,
      [fieldId, userId, startsAt, endsAt, status],
    );
  }

  it('rejects simultaneous overlapping inserts from separate transactions', async () => {
    const first = await pool.connect();
    const second = await pool.connect();
    try {
      await first.query('BEGIN');
      await insertReservation(first, '2035-01-10T10:00:00Z', '2035-01-10T11:00:00Z');

      await second.query('BEGIN');
      const competingInsert = insertReservation(
        second,
        '2035-01-10T10:30:00Z',
        '2035-01-10T11:30:00Z',
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      await first.query('COMMIT');
      await expect(competingInsert).rejects.toMatchObject({ code: '23P01' });
      await second.query('ROLLBACK');
    } finally {
      first.release();
      second.release();
    }
  });

  it('allows adjacent half-open intervals and reuse after cancellation', async () => {
    await insertReservation(pool, '2035-01-11T10:00:00Z', '2035-01-11T11:00:00Z');
    await expect(
      insertReservation(pool, '2035-01-11T11:00:00Z', '2035-01-11T12:00:00Z'),
    ).resolves.toBeDefined();

    await insertReservation(pool, '2035-01-12T10:00:00Z', '2035-01-12T11:00:00Z');
    await pool.query(
      `UPDATE reservations SET status = 'CANCELLED'
       WHERE field_id = $1 AND starts_at = $2`,
      [fieldId, '2035-01-12T10:00:00Z'],
    );
    await expect(
      insertReservation(pool, '2035-01-12T10:00:00Z', '2035-01-12T11:00:00Z'),
    ).resolves.toBeDefined();
  });
});
