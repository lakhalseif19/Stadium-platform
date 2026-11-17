import { ApiProperty } from '@nestjs/swagger';

export class FieldResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  stadium_id: string;
  @ApiProperty()
  name_ar: string;
  @ApiProperty()
  name_fr: string;
  @ApiProperty()
  name_en: string;
  @ApiProperty()
  booking_mode: string;
  @ApiProperty()
  opens_at: string;
  @ApiProperty()
  closes_at: string;
  @ApiProperty()
  is_active: boolean;
}
