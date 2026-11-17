import { IsUUID, IsDateString } from 'class-validator';

export class AvailabilityQueryDto {
  @IsUUID()
  field_id: string;

  @IsDateString()
  date: string;
}
