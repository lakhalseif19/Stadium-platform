import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Public, Roles } from '../common/decorators';
import { Role } from '../common/enums';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  createPayment(@Body() _dto: CreatePaymentDto) {
    return this.paymentsService.createPayment();
  }

  @Public()
  @Post('webhook')
  webhook() {
    return this.paymentsService.handleWebhook();
  }

  @Roles(Role.ADMIN)
  @Get()
  async getPayments(@Query('limit') limit = 10, @Query('offset') offset = 0) {
    return this.paymentsService.getPayments(limit, offset);
  }

  @Roles(Role.ADMIN)
  @Get('stats')
  async getStats() {
    return this.paymentsService.getStats();
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  async getPaymentById(@Param('id') id: string) {
    return this.paymentsService.getPaymentById(id);
  }
}
