import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CheckInService } from '../src/check-in/check-in.service';
import { ScanQrDto } from '../src/check-in/dto/scan-qr.dto';

describe('CheckInService', () => {
  const payload = { sub: 'reservation-1', uid: 'user-1', fid: 'field-1' };
  let service: CheckInService;
  let verifyAsync: jest.Mock;
  let query: jest.Mock;
  let release: jest.Mock;

  beforeEach(() => {
    verifyAsync = jest.fn().mockResolvedValue(payload);
    query = jest.fn(async (sql: string) => {
      if (sql.includes('SELECT r.id')) {
        return {
          rows: [
            {
              id: payload.sub,
              owner_id: payload.uid,
              field_id: payload.fid,
              status: 'CONFIRMED',
              starts_at: new Date(Date.now() - 60 * 60 * 1000),
              ends_at: new Date(Date.now() + 60 * 60 * 1000),
              payment_confirmed: true,
            },
          ],
        };
      }
      if (sql.includes('UPDATE reservations')) {
        return { rowCount: 1, rows: [{ checked_in_at: new Date() }] };
      }
      return { rowCount: 1, rows: [] };
    });
    release = jest.fn();
    const client = { query, release };
    const pool = { connect: jest.fn().mockResolvedValue(client) };
    service = new CheckInService(
      { verifyAsync } as any,
      { get: jest.fn().mockReturnValue('test-qr-secret') } as any,
      pool as any,
    );
  });

  it('validates the QR token as a non-empty string within the request size limit', async () => {
    const empty = await validate(plainToInstance(ScanQrDto, { token: '' }));
    const oversized = await validate(plainToInstance(ScanQrDto, { token: 'x'.repeat(4097) }));
    const valid = await validate(plainToInstance(ScanQrDto, { token: 'signed-token' }));

    expect(empty.length).toBeGreaterThan(0);
    expect(oversized.length).toBeGreaterThan(0);
    expect(valid).toHaveLength(0);
  });

  it('records one authorized, paid check-in and an audit event in one transaction', async () => {
    await expect(service.scanQr('guard-1', 'signed-qr')).resolves.toMatchObject({
      reservation_id: payload.sub,
      status: 'CHECKED_IN',
    });
    expect(query.mock.calls.map(([sql]) => sql.trim().split(/\s+/).slice(0, 2).join(' '))).toEqual([
      'BEGIN',
      'SELECT r.id,',
      'UPDATE reservations',
      'INSERT INTO',
      'COMMIT',
    ]);
    expect(query.mock.calls[3][0]).toContain('INSERT INTO audit_logs');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('rejects a signed QR whose owner or field claims do not match the database row', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [], rowCount: 0 };
      if (sql.includes('SELECT r.id')) {
        return {
          rows: [
            {
              id: payload.sub,
              owner_id: 'another-user',
              field_id: payload.fid,
              status: 'CONFIRMED',
              payment_confirmed: true,
            },
          ],
        };
      }
      return { rows: [], rowCount: 0 };
    });

    await expect(service.scanQr('guard-1', 'signed-qr')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(query.mock.calls.some(([sql]) => sql.includes('UPDATE reservations'))).toBe(false);
    expect(query.mock.calls.at(-1)[0]).toBe('ROLLBACK');
  });

  it('rejects expired or invalid signatures before opening a database transaction', async () => {
    verifyAsync.mockRejectedValue(new Error('expired'));
    await expect(service.scanQr('guard-1', 'expired-qr')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('fails closed when the QR signing secret is missing', async () => {
    service = new CheckInService(
      { verifyAsync } as any,
      { get: jest.fn().mockReturnValue(undefined) } as any,
      { connect: jest.fn() } as any,
    );
    await expect(service.scanQr('guard-1', 'signed-qr')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('rejects unpaid or already used reservations without updating them', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [], rowCount: 0 };
      if (sql.includes('SELECT r.id')) {
        return {
          rows: [
            {
              id: payload.sub,
              owner_id: payload.uid,
              field_id: payload.fid,
              status: 'CONFIRMED',
              payment_confirmed: false,
            },
          ],
        };
      }
      return { rows: [], rowCount: 0 };
    });
    await expect(service.scanQr('guard-1', 'signed-qr')).rejects.toThrow('PAYMENT_PENDING');
    expect(query.mock.calls.some(([sql]) => sql.includes('UPDATE reservations'))).toBe(false);
  });
});
