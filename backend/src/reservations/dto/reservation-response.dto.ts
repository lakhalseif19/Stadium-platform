export class ReservationResponseDto {
  id: string;
  field_id: string;
  user_id: string;
  starts_at: Date;
  ends_at: Date;
  coverage: string;
  type: string;
  status: string;
  created_at: Date;
}
