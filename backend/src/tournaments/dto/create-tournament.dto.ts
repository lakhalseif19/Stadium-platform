import { IsString, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TournamentSlotDto } from './tournament-slot.dto';

export class CreateTournamentDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsDateString()
  starts_on: string;

  @IsDateString()
  ends_on: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TournamentSlotDto)
  slots: TournamentSlotDto[];
}
