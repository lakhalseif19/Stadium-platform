import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WebhookPayloadDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  provider_transaction_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  status: string;
}
