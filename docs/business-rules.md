# Business Rules

This document outlines the core business logic of the Sétif Stadium Reservation Platform.

## 1. Geographical Scope & Hierarchy
- **Scope (V1):** Strictly limited to the Wilaya of Sétif, Algeria. PostGIS constraints will ensure stadiums fall within this boundary.
- **Hierarchy:** Wilaya -> Commune -> Stadium -> Field.
- A stadium can have multiple fields (e.g., 5v5, 7v7, 11v11).

## 2. Temporal Rules & Seasons
- **Season:** The operational season runs from September 1st to July 31st.
- **August Break:** August is reserved for maintenance; no regular subscriptions are processed (one-off bookings may be permitted based on admin toggle).
- **Booking Window:** Regular users can only book up to **7 days in advance**.
- **Slot Duration:** A standard single reservation block is exactly **1 hour**.

## 3. Coverage & Conflict Matrix
Fields can be booked entirely or in halves. The conflict matrix is enforced at the DB level.
- `FULL`: Covers the entire field. Blocks `FULL`, `HALF_A`, and `HALF_B`.
- `HALF_A`: Covers the first half. Blocks `FULL` and `HALF_A`.
- `HALF_B`: Covers the second half. Blocks `FULL` and `HALF_B`.

## 4. Subscriptions
- **Durations:** 1 month, 3 months, 6 months, or Yearly.
- **Payment:** 100% upfront payment is required to activate the subscription.
- **Mechanics:** Subscriptions grant specific weekly recurring time slots (e.g., every Tuesday at 18:00).
- **Materialization:** Subscription slots are materialized as standard reservations in the DB.
- **Grace Period:** A 15-day grace period exists for renewals before the slot is released to the public.

## 5. Teams & Tournaments
- **Teams:** Created and managed by system admins. Teams are allotted 1 to 3 training sessions per week. A team's season mandate cannot exceed 1 year.
- **Tournaments:** Exclusively admin-created. Tournaments have override priority for scheduling but must handle existing booking conflicts (either via cancellation + refund or block-out dates).

## 6. Closures & Maintenance
- Stadium admins can issue closures (weather, maintenance).
- Any existing bookings within the closure window are automatically cancelled, and users are notified/refunded based on policy.

## 7. Payments & Booking Flow
- When a user selects a slot, it is placed in a `PENDING` state (held for 10 minutes).
- Payment completes via Gateway -> Webhook received -> Status updates to `CONFIRMED`.
- If no webhook is received within 10 minutes, the slot is released.

## 8. Check-in & Security (Guards)
- Users receive a QR code (Signed JWT) upon confirmation.
- Guards scan the QR code via the mobile app to verify validity (date, time, location, authenticity).

## 9. Cancellations
- **User Cancellation:** Allowed up to 24 hours before the slot for a full/partial refund (defined by local admin).
- **Admin Cancellation:** Forces a full refund.
