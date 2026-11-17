import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { SubscriptionsRepository } from './subscriptions.repository';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly repository: SubscriptionsRepository) {}

  async createSubscription(_dto: unknown, _userId: string): Promise<never> {
    throw new ServiceUnavailableException(
      'Subscription creation is unavailable until pricing and payment are verified by a real provider.',
    );
  }

  async listSubscriptions(userId: string) {
    return this.repository.listByUser(userId);
  }

  async cancelSubscription(id: string, userId: string) {
    const result = await this.repository.cancelActiveByUser(id, userId);
    if (!result.rowCount) {
      throw new NotFoundException('Active subscription not found');
    }
    return result.rows[0];
  }
}
