# Security Documentation

## Authentication Architecture
The platform relies on stateless JWTs (JSON Web Tokens) for authentication. 
- **Tokens:** Short-lived access tokens (15 minutes) and long-lived refresh tokens (7 days).
- **Storage:** Refresh tokens stored in HTTP-only, secure cookies. Access tokens in memory/local storage.

## Role-Based Access Control (RBAC)
Roles available in the system:
1. **USER:** Can view stadiums, book fields (<= 7 days out), manage own profile.
2. **GUARD:** Can access the QR scanning endpoint/module to verify reservations.
3. **ADMIN:** Manages specific stadiums, closures, team schedules.
4. **SUPER_ADMIN:** System-wide management.

## Password Hashing
- **Algorithm:** Argon2id.
- Parameters configured to provide high resistance against GPU-based cracking while maintaining acceptable server response times (<500ms).

## QR Code Security
QR codes used for stadium entry are **Signed JWTs**.
- **Payload:** Reservation ID, User ID, Stadium ID, Time Slot.
- **Signature:** Signed by the backend's private key. 
- **Verification:** Guards' app verifies the signature using the public key. This prevents users from forging screenshots or creating fake QR codes.

## Rate Limiting
- **Global:** 100 requests per minute per IP.
- **Auth Endpoints:** 5 requests per minute per IP (Login/Register) to prevent brute-force attacks.
- Implemented via Redis.

## Input Validation
- All incoming requests are strictly validated using DTOs (Data Transfer Objects) and a validation library (e.g., Zod or class-validator).
- SQL Injection is prevented by using parameterized queries and ORM query builders.

## CORS Policy
- Restricted to explicit allowed origins (the Flutter web app domain, mobile app deep links).

## Audit Logging
- Critical actions (cancellations, role changes, stadium creation) are logged in an `audit_logs` table with User ID, Action, Timestamp, and IP address.
