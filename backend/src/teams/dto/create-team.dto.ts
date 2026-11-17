import {
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class TeamSlotDto {
  day_of_week: number;
  start_time: string;
}

export class CreateTeamDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  @Max(3)
  sessions_per_week: number;

  @IsDateString()
  starts_on: string;

  @IsDateString()
  ends_on: string;

  @IsUUID()
  field_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamSlotDto)
  slots: TeamSlotDto[];
}
