import { ApiProperty } from '@nestjs/swagger';

export class PricingResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  field_id: string;
  @ApiProperty()
  season_id: string;
  @ApiProperty()
  coverage: string;
  @ApiProperty()
  duration_type: string;
  @ApiProperty()
  amount: string;
}
