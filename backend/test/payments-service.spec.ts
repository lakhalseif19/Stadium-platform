import { ServiceUnavailableException } from '@nestjs/common';
import { PaymentsService } from '../src/payments/payments.service';

describe('PaymentsService when no real provider is configured', () => {
  it('fails closed before creating payment records', async () => {
    const repository = { createPayment: jest.fn() };
    const service = new PaymentsService(repository as any);

    expect(() => service.createPayment()).toThrow(ServiceUnavailableException);
    expect(repository.createPayment).not.toHaveBeenCalled();
  });

  it('does not accept webhooks without a configured provider', async () => {
    const service = new PaymentsService({} as any);

    expect(() => service.handleWebhook()).toThrow(ServiceUnavailableException);
  });
});
