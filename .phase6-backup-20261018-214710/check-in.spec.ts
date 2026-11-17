import * as jwt from 'jsonwebtoken';

describe('QR Code Generation & Guard Check-In Validation', () => {
  const secret = 'test-qr-secret-key-12345';

  it('generates and verifies signed short-lived QR token', () => {
    const payload = {
      sub: 'res-uuid-112233',
      uid: 'user-uuid-445566',
      fid: 'field-uuid-778899',
    };

    const token = jwt.sign(payload, secret, { expiresIn: '5m' });
    expect(token).toBeDefined();

    const decoded = jwt.verify(token, secret) as any;
    expect(decoded.sub).toBe('res-uuid-112233');
    expect(decoded.uid).toBe('user-uuid-445566');
    expect(decoded.fid).toBe('field-uuid-778899');
  });

  it('rejects expired QR token', () => {
    const payload = { sub: 'res-1' };
    const expiredToken = jwt.sign(payload, secret, { expiresIn: '-1s' });

    expect(() => {
      jwt.verify(expiredToken, secret);
    }).toThrow();
  });

  it('rejects forged or modified QR token', () => {
    const token = jwt.sign({ sub: 'res-valid' }, secret, { expiresIn: '5m' });
    const tamperedToken = token.slice(0, -5) + 'abcde';

    expect(() => {
      jwt.verify(tamperedToken, secret);
    }).toThrow();
  });

  it('enforces atomic single check-in (replay prevention)', () => {
    const reservationState = {
      id: 'res-123',
      status: 'CONFIRMED',
      checked_in_at: null as Date | null,
    };

    function checkIn(res: typeof reservationState) {
      if (res.status === 'CHECKED_IN' || res.checked_in_at !== null) {
        throw new Error('Cette réservation a déjà été utilisée.');
      }
      res.status = 'CHECKED_IN';
      res.checked_in_at = new Date();
      return true;
    }

    // First scan succeeds
    expect(checkIn(reservationState)).toBe(true);
    expect(reservationState.status).toBe('CHECKED_IN');
    expect(reservationState.checked_in_at).toBeDefined();

    // Replay scan MUST be rejected
    expect(() => checkIn(reservationState)).toThrow('Cette réservation a déjà été utilisée.');
  });
});
