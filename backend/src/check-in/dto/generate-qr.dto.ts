import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateQrDto {
  @ApiProperty()
  @IsUUID()
  reservation_id: string;
}
