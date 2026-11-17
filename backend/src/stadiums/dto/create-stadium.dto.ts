import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStadiumDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name_ar: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name_fr: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name_en?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  commune_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
