export type UserRole = "CITIZEN" | "GUARD" | "ADMIN" | "SUPER_ADMIN";

export type ReservationStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "CHECKED_IN"
  | "COMPLETED";

export type PaymentStatus =
  "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";

export type CoverageType = "FULL" | "HALF_A" | "HALF_B";
export type BookingMode = "FULL_ONLY" | "FULL_AND_HALF";

export interface User {
  id: string;
  phone?: string;
  email?: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  phone_verified?: boolean;
  roles?: UserRole[];
}

export interface Stadium {
  id: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  address: string;
  commune_id: string;
  commune_name?: string;
  is_active: boolean;
  fields_count?: number;
}

export interface Field {
  id: string;
  stadium_id: string;
  stadium_name?: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  booking_mode: BookingMode;
  opens_at: string;
  closes_at: string;
  is_active: boolean;
}

export interface Reservation {
  id: string;
  field_id: string;
  field_name?: string;
  stadium_name?: string;
  user_id?: string;
  user_name?: string;
  type: "SINGLE" | "SUBSCRIPTION" | "TEAM";
  coverage: CoverageType;
  starts_at: string;
  ends_at: string;
  status: ReservationStatus;
  checked_in_at?: string;
  checked_in_by?: string;
  amount?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  user_name?: string;
  field_id: string;
  field_name?: string;
  coverage: CoverageType;
  starts_on: string;
  ends_on: string;
  renewal_deadline: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  amount_paid: string;
  currency: string;
}

export interface Payment {
  id: string;
  reservation_id?: string;
  subscription_id?: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  provider: string;
  provider_transaction_id?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: unknown;
  new_values?: unknown;
  ip_address?: string;
  created_at: string;
}
