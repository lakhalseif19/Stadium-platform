export class SubscriptionResponseDto {
  id: string;
  field_id: string;
  user_id: string;
  pricing_plan_id: string;
  coverage: string;
  status: string;
  starts_on: Date;
  ends_on: Date;
  renewal_deadline: Date;
}
