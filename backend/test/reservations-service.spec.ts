import { CoverageType, ReservationType } from '../src/common/enums';
import { ReservationsService } from '../src/reservations/reservations.service';
import { ReservationsRepository } from '../src/reservations/reservations.repository';

const slot = {
  field_id: 'field-id',
  starts_at: '2030-05-15T18:00:00.000Z',
  coverage: CoverageType.FULL,
} as any;

describe('ReservationsService authorization and integrity behavior', () => {
  const makeService = (queryImplementation?: jest.Mock) => {
    const client = { query: jest.fn().mockResolvedValue({}), release: jest.fn() };
    const pool = {
      connect: jest.fn().mockResolvedValue(client),
      query: queryImplementation ?? jest.fn().mockResolvedValue({ rowCount: 0, rows: [] }),
    };
    const repository = { create: jest.fn().mockResolvedValue({ id: 'reservation-id' }) };
    return {
      service: new ReservationsService(
        pool as any,
        repository as unknown as ReservationsRepository,
      ),
      client,
      pool,
      repository,
    };
  };

  it('rejects creating a reservation for a different user before inserting', async () => {
    const { service, repository } = makeService();
    await expect(
      service.createReservation({ ...slot, user_id: 'other-user' }, 'authenticated-user', false),
    ).rejects.toMatchObject({ response: expect.objectContaining({ statusCode: 403 }) });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects invalid and past start times before inserting', async () => {
    const { service, repository } = makeService();
    await expect(
      service.createReservation({ ...slot, starts_at: 'not-a-date' }, 'authenticated-user', false),
    ).rejects.toMatchObject({ response: expect.objectContaining({ statusCode: 400 }) });
    await expect(
      service.createReservation(
        { ...slot, starts_at: '2000-01-01T18:00:00.000Z' },
        'authenticated-user',
        false,
      ),
    ).rejects.toMatchObject({ response: expect.objectContaining({ statusCode: 400 }) });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('maps a repeated conflicting booking to HTTP 409', async () => {
    const duplicateError = Object.assign(new Error('duplicate booking'), { code: '23P01' });
    const { service, repository } = makeService();
    repository.create
      .mockResolvedValueOnce({ id: 'reservation-id' })
      .mockRejectedValueOnce(duplicateError);

    await expect(
      service.createReservation(slot, 'authenticated-user', false),
    ).resolves.toMatchObject({ id: 'reservation-id' });
    await expect(
      service.createReservation(slot, 'authenticated-user', false),
    ).rejects.toMatchObject({ response: expect.objectContaining({ statusCode: 409 }) });
  });

  it('persists a one-off booking using a valid database reservation type', async () => {
    const { service, repository } = makeService();

    await service.createReservation(slot, 'authenticated-user', false);

    expect(repository.create.mock.calls[0][0].type).toBe(ReservationType.SINGLE);
  });

  it('maps database exclusion conflicts to HTTP 409 when concurrent inserts race', async () => {
    const exclusionError = Object.assign(new Error('exclusion constraint violation'), {
      code: '23P01',
    });
    const { service, client, repository } = makeService();
    repository.create.mockImplementationOnce(async () => {
      throw exclusionError;
    });

    const attempts = await Promise.allSettled([
      service.createReservation(slot, 'user-a', false),
      service.createReservation(slot, 'user-b', false),
    ]);
    const outcomes = attempts.map((attempt) => attempt.status);
    expect(outcomes.filter((status) => status === 'fulfilled')).toHaveLength(1);
    // A real PostgreSQL exclusion constraint is what selects the losing transaction; this unit test verifies mapping.
    const rejected = attempts.find(
      (attempt) => attempt.status === 'rejected',
    ) as PromiseRejectedResult;
    expect(rejected.reason.getStatus()).toBe(409);
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('allows cancellation only for the authenticated owner and cancellable future bookings', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const { service } = makeService(query);
    await expect(
      service.cancelReservation('someone-elses-reservation', 'current-user'),
    ).rejects.toMatchObject({ response: expect.objectContaining({ statusCode: 404 }) });
    expect(query.mock.calls[0][0]).toContain('WHERE id = $1 AND user_id = $2');

    const validQuery = jest
      .fn()
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'owned', status: 'CANCELLED' }] });
    const valid = makeService(validQuery).service;
    await expect(valid.cancelReservation('owned', 'current-user')).resolves.toMatchObject({
      status: 'CANCELLED',
    });
  });
});
