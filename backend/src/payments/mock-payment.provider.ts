import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  async createPayment(
    _amount: number,
    _currency: string,
    _metadata: any,
  ): Promise<{ transactionId: string; url: string; status: string }> {
    throw new ServiceUnavailableException(
      'Mock payment checkout is disabled; configure a verified payment provider.',
    );
  }

  verifyWebhook(_payload: any, _signature: string, _secret: string): boolean {
    // This provider has no authentic webhook signing protocol. Never allow a
    // mock integration to confirm a payment from an unauthenticated callback.
    return false;
  }
}
