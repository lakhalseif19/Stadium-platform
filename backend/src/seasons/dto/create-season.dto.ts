import { IsString, IsNotEmpty, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SeasonStatus } from '../../common/enums';

export class CreateSeasonDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  starts_on: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  ends_on: string;

  @ApiProperty({ enum: SeasonStatus })
  @IsEnum(SeasonStatus)
  @IsNotEmpty()
  status: SeasonStatus;
}
