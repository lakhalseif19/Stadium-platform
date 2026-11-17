import { IsUUID, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CoverageType } from '../../common/enums';

class SubscriptionSlotDto {
  day_of_week: number;
  start_time: string;
}

export class CreateSubscriptionDto {
  @IsUUID()
  field_id: string;

  @IsUUID()
  pricing_plan_id: string;

  @IsEnum(CoverageType)
  coverage: CoverageType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubscriptionSlotDto)
  slots: SubscriptionSlotDto[];
}
