import { AvailabilityService } from '../src/reservations/availability.service';

describe('AvailabilityService local date boundaries', () => {
  afterEach(() => jest.useRealTimers());

  it('uses Algeria local midnight and overlaps bookings by timestamp', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-17T20:00:00.000Z'));
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [
            {
              opens_at: '08:00:00',
              closes_at: '10:00:00',
              // 2026-10-18 00:00 in Africa/Algiers (UTC+01:00).
              day_start: new Date('2026-10-17T23:00:00.000Z'),
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              starts_at: new Date('2026-10-18T07:30:00.000Z'),
              ends_at: new Date('2026-10-18T08:00:00.000Z'),
            },
          ],
        }),
    };
    const service = new AvailabilityService(pool as any);

    const slots = await service.getAvailability('field-1', '2026-10-18');

    expect(slots).toEqual([
      { startTime: '08:00', endTime: '09:00', isAvailable: false },
      { startTime: '09:00', endTime: '10:00', isAvailable: true },
    ]);
    expect(pool.query.mock.calls[0][0]).toContain("AT TIME ZONE 'Africa/Algiers'");
    expect(pool.query.mock.calls[1][0]).toContain("AT TIME ZONE 'Africa/Algiers'");
  });
});
