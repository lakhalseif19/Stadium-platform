import { ApiProperty } from '@nestjs/swagger';

export class CheckInResponseDto {
  @ApiProperty()
  reservation_id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  checked_in_at: Date;
}
