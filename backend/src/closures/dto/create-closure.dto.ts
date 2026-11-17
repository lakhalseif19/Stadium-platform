import { IsString, IsDateString, IsUUID } from 'class-validator';

export class CreateClosureDto {
  @IsUUID()
  field_id: string;

  @IsString()
  reason: string;

  @IsString()
  reason_details: string;

  @IsDateString()
  starts_at: string;

  @IsDateString()
  ends_at: string;
}
