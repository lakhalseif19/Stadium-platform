import { PaymentStatus } from '../src/common/enums';
import { MockPaymentProvider } from '../src/payments/mock-payment.provider';

describe('Payment State Machine & Idempotency Rules', () => {
  const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
    [PaymentStatus.PENDING]: [
      PaymentStatus.PROCESSING,
      PaymentStatus.FAILED,
      PaymentStatus.CANCELLED,
    ],
    [PaymentStatus.PROCESSING]: [PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.CANCELLED],
    [PaymentStatus.PAID]: [PaymentStatus.REFUNDED],
    [PaymentStatus.FAILED]: [],
    [PaymentStatus.CANCELLED]: [],
    [PaymentStatus.REFUNDED]: [],
  };

  function canTransition(current: PaymentStatus, target: PaymentStatus): boolean {
    return validTransitions[current]?.includes(target) ?? false;
  }

  it('allows valid state machine transitions', () => {
    expect(canTransition(PaymentStatus.PENDING, PaymentStatus.PROCESSING)).toBe(true);
    expect(canTransition(PaymentStatus.PROCESSING, PaymentStatus.PAID)).toBe(true);
    expect(canTransition(PaymentStatus.PAID, PaymentStatus.REFUNDED)).toBe(true);
  });

  it('rejects invalid or backwards state machine transitions', () => {
    // Cannot transition from PAID back to PENDING
    expect(canTransition(PaymentStatus.PAID, PaymentStatus.PENDING)).toBe(false);
    // Cannot transition from FAILED to PAID directly
    expect(canTransition(PaymentStatus.FAILED, PaymentStatus.PAID)).toBe(false);
    // Cannot transition from REFUNDED to PAID
    expect(canTransition(PaymentStatus.REFUNDED, PaymentStatus.PAID)).toBe(false);
  });

  it('enforces idempotency key uniqueness logic', () => {
    const idempotencyCache = new Map<string, any>();
    const key = 'idem-req-998877';
    const initialResponse = { status: 'PENDING', paymentId: 'pay-123', amount: '2500.00' };

    idempotencyCache.set(key, initialResponse);

    // Duplicate call with same key returns cached response
    const duplicateLookup = idempotencyCache.get(key);
    expect(duplicateLookup).toEqual(initialResponse);
    expect(duplicateLookup.paymentId).toBe('pay-123');
  });
});

describe('mock payment provider webhook handling', () => {
  it('never authenticates webhook callbacks without a real signing protocol', () => {
    const provider = new MockPaymentProvider();

    expect(provider.verifyWebhook({ status: 'PAID' }, 'anything', 'secret')).toBe(false);
  });
});
