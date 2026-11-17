import { IsNotEmpty, IsEnum, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Coverage, DurationType } from '../../common/enums';

export class CreatePricingDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  field_id: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  season_id: string;

  @ApiProperty({ enum: Coverage })
  @IsEnum(Coverage)
  @IsNotEmpty()
  coverage: Coverage;

  @ApiProperty({ enum: DurationType })
  @IsEnum(DurationType)
  @IsNotEmpty()
  duration_type: DurationType;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;
}
