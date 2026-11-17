import { ServiceUnavailableException } from '@nestjs/common';
import { MockPaymentProvider } from '../src/payments/mock-payment.provider';

describe('MockPaymentProvider', () => {
  it('does not create fake checkout URLs or payment attempts', async () => {
    const provider = new MockPaymentProvider();

    await expect(provider.createPayment(100, 'DZD', {})).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('never authenticates a webhook', () => {
    const provider = new MockPaymentProvider();
    expect(provider.verifyWebhook({}, 'signature', 'secret')).toBe(false);
  });
});
