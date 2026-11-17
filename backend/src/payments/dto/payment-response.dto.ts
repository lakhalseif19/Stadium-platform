import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty()
  payment_id: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  payment_url?: string;
}
