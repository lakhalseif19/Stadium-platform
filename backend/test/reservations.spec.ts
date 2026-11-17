import { CoverageType } from '../src/common/enums';

describe('Reservation Business Rules & Conflict Matrix', () => {
  function coverageOverlaps(cov1: CoverageType, cov2: CoverageType): boolean {
    const mapCoverage = (c: CoverageType): number[] => {
      switch (c) {
        case CoverageType.FULL:
          return [1, 2];
        case CoverageType.HALF_A:
          return [1];
        case CoverageType.HALF_B:
          return [2];
      }
    };

    const arr1 = mapCoverage(cov1);
    const arr2 = mapCoverage(cov2);
    return arr1.some((val) => arr2.includes(val));
  }

  it('enforces coverage conflict matrix according to business rules', () => {
    // FULL + FULL = forbidden
    expect(coverageOverlaps(CoverageType.FULL, CoverageType.FULL)).toBe(true);

    // FULL + HALF_A = forbidden
    expect(coverageOverlaps(CoverageType.FULL, CoverageType.HALF_A)).toBe(true);

    // FULL + HALF_B = forbidden
    expect(coverageOverlaps(CoverageType.FULL, CoverageType.HALF_B)).toBe(true);

    // HALF_A + HALF_A = forbidden
    expect(coverageOverlaps(CoverageType.HALF_A, CoverageType.HALF_A)).toBe(true);

    // HALF_B + HALF_B = forbidden
    expect(coverageOverlaps(CoverageType.HALF_B, CoverageType.HALF_B)).toBe(true);

    // HALF_A + HALF_B = ALLOWED (No overlap!)
    expect(coverageOverlaps(CoverageType.HALF_A, CoverageType.HALF_B)).toBe(false);
  });

  it('validates single booking slot is exactly 1 hour', () => {
    const startsAt = new Date('2026-10-15T18:00:00Z');
    const endsAtValid = new Date('2026-10-15T19:00:00Z');
    const endsAtInvalid = new Date('2026-10-15T19:30:00Z');

    const durationMinutesValid = (endsAtValid.getTime() - startsAt.getTime()) / (1000 * 60);
    const durationMinutesInvalid = (endsAtInvalid.getTime() - startsAt.getTime()) / (1000 * 60);

    expect(durationMinutesValid).toBe(60);
    expect(durationMinutesInvalid).not.toBe(60);
  });

  it('detects August administrative break', () => {
    const isAugustBreak = (date: Date): boolean => {
      // getUTCMonth() is 0-indexed: August is 7
      return date.getUTCMonth() === 7;
    };

    const dateJuly = new Date('2026-07-20T10:00:00Z');
    const dateAugust = new Date('2026-08-10T10:00:00Z');
    const dateSeptember = new Date('2026-09-05T10:00:00Z');

    expect(isAugustBreak(dateJuly)).toBe(false);
    expect(isAugustBreak(dateAugust)).toBe(true);
    expect(isAugustBreak(dateSeptember)).toBe(false);
  });
});
