import { Controller, Post, Body, Request, Get, Param, Delete } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  async createSubscription(@Request() req: any, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.createSubscription(dto, req.user.id);
  }

  @Get()
  async listUserSubscriptions(@Request() req: any) {
    return this.subscriptionsService.listSubscriptions(req.user.id);
  }

  @Delete(':id/cancel')
  async cancelSubscription(@Request() req: any, @Param('id') id: string) {
    return this.subscriptionsService.cancelSubscription(id, req.user.id);
  }
}
