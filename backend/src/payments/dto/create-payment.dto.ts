import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  reservation_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  subscription_id?: string;

  @ApiProperty()
  @IsString()
  idempotency_key: string;
}
