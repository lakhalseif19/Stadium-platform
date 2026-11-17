import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';

@Injectable()
export class PaymentsService {
  constructor(private readonly repository: PaymentsRepository) {}

  createPayment(): never {
    return this.ensureProviderAvailable();
  }

  handleWebhook(): never {
    return this.ensureProviderAvailable();
  }

  async getPayments(limit: number, offset: number) {
    return this.repository.getPayments(limit, offset);
  }

  async getPaymentById(id: string) {
    return this.repository.getPaymentById(id);
  }

  async getStats() {
    return this.repository.getStats();
  }

  private ensureProviderAvailable(): never {
    throw new ServiceUnavailableException(
      'Payment processing is unavailable because no real payment provider is configured.',
    );
  }
}
