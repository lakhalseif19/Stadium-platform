import { IsUUID, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { CoverageType } from '../../common/enums';

export class CreateReservationDto {
  @IsUUID()
  field_id: string;

  @IsDateString()
  starts_at: string;

  @IsEnum(CoverageType)
  coverage: CoverageType;

  @IsOptional()
  @IsUUID()
  user_id?: string;
}
