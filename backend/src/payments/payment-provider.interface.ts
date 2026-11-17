export interface PaymentProvider {
  createPayment(
    amount: number,
    currency: string,
    metadata: any,
  ): Promise<{ transactionId: string; url: string; status: string }>;
  verifyWebhook(payload: any, signature: string, secret: string): boolean;
}
