import { ApiProperty } from '@nestjs/swagger';

export class StadiumResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name_ar: string;

  @ApiProperty()
  name_fr: string;

  @ApiProperty()
  name_en: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  commune_id: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
