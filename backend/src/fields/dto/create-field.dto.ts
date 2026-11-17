import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingMode } from '../../common/enums';

export class CreateFieldDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  stadium_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name_ar: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name_fr: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  name_en?: string;

  @ApiProperty({ enum: BookingMode })
  @IsEnum(BookingMode)
  @IsNotEmpty()
  booking_mode: BookingMode;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  @IsNotEmpty()
  opens_at: string;

  @ApiProperty({ example: '22:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  @IsNotEmpty()
  closes_at: string;
}
