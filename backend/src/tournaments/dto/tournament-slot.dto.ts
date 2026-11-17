import { IsUUID, IsDateString, IsEnum } from 'class-validator';
import { CoverageType } from '../../common/enums';

export class TournamentSlotDto {
  @IsUUID()
  field_id: string;

  @IsEnum(CoverageType)
  coverage: CoverageType;

  @IsDateString()
  starts_at: string;

  @IsDateString()
  ends_at: string;
}
