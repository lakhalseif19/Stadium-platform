# Full System Audit — Stadium Platform Sétif

**Audit date:** 2026-10-22  
**Source:** Static code inspection of the complete repository. No live database, Redis, or running backend was available.

---

## 1. Backend Audit (NestJS 11 / TypeScript 5.7)

### 1.1 Application Bootstrap
- **Entry:** `backend/src/main.ts` — NestFactory with helmet, CORS, global ValidationPipe (whitelist, forbidNonWhitelisted, transform), prefix `api/v1`, Swagger at `/api/docs`.
- **App Module:** `backend/src/app.module.ts` — 22 feature modules imported. Global guards: ThrottlerGuard, JwtAuthGuard, RolesGuard, PermissionsGuard.
- **Config:** `backend/src/config/index.ts` — loads appConfig, databaseConfig, redisConfig, jwtConfig, s3Config from env.
- **Production secrets:** `backend/src/config/production-secrets.ts` — validates JWT/QR secrets in production mode.

### 1.2 Module Inventory

| Module | Controller | Service | Repository | DTOs | Status |
|---|---|---|---|---|---|
| auth | ✅ 4 endpoints | ✅ full flow | — | register, login, verify-otp, refresh-token | IMPLEMENTED |
| users | ✅ 6 endpoints | ✅ CRUD | ✅ | create-user, update-user, user-response | IMPLEMENTED |
| rbac | — | ✅ | ✅ | — | IMPLEMENTED |
| stadiums | ✅ 5 endpoints | ✅ CRUD+toggle | ✅ | create, update, search, response | IMPLEMENTED |
| fields | ✅ 5 endpoints | ✅ CRUD+toggle | ✅ | create, update, response | IMPLEMENTED |
| stadium-media | ✅ | ✅ | — | create, update | IMPLEMENTED |
| seasons | ✅ | ✅ | — | create, update | IMPLEMENTED |
| pricing | ✅ | ✅ | — | create, update, response | IMPLEMENTED |
| reservations | ✅ 4 endpoints | ✅ transactional | ✅ | create, response, availability-query | IMPLEMENTED |
| subscriptions | ✅ 3 endpoints | ✅ | ✅ | create, response | PARTIALLY IMPLEMENTED |
| teams | ✅ 1 endpoint (POST only) | ✅ | ✅ | create, response | PARTIALLY IMPLEMENTED |
| tournaments | ✅ 1 endpoint (POST only) | ✅ | ✅ | create, slot | PARTIALLY IMPLEMENTED |
| closures | ✅ 2 endpoints | ✅ | — | create | IMPLEMENTED |
| payments | ✅ 5 endpoints | ✅ mock | ✅ | create, response, webhook | IMPLEMENTED (mock only) |
| check-in | ✅ 2 endpoints | ✅ full flow | — | generate-qr, scan-qr | IMPLEMENTED |
| notifications | ✅ | ✅ | ✅ | create, response | IMPLEMENTED |
| audit | ✅ 1 endpoint | ✅ | — | — | IMPLEMENTED |
| health | ✅ 3 endpoints | ✅ | — | — | IMPLEMENTED |
| database | — | — | pool provider | — | IMPLEMENTED |
| redis | — | — | client provider | — | IMPLEMENTED |
| common | — | — | — | enums, exceptions, decorators, filters, interceptors | IMPLEMENTED |
| config | — | — | — | — | IMPLEMENTED |

### 1.3 Critical Backend Findings

**FIND-BE-01: Role string case inconsistency (CRITICAL)**
- `backend/src/users/users.controller.ts:34,41,48,55,62` uses `@Roles('admin')` (lowercase)
- `backend/src/audit/audit.controller.ts:11` uses `@Roles('admin')` (lowercase)
- `backend/src/reservations/reservations.controller.ts:17` uses `@Roles('ADMIN')` (uppercase)
- `backend/src/payments/payments.controller.ts:24,30,36` uses `@Roles(Role.ADMIN)` (enum = 'ADMIN')
- `backend/src/teams/teams.controller.ts:10` uses `@Roles('ADMIN')` (uppercase)
- `backend/src/common/enums.ts:138` defines `ADMIN = 'ADMIN'` (uppercase)
- **Impact:** If the RolesGuard compares case-sensitively, all users/audit endpoints are BLOCKED for admins.
- **Recommended fix:** Change all `@Roles('admin')` to `@Roles('ADMIN')` or `@Roles(Role.ADMIN)`.

**FIND-BE-02: Teams controller lacks GET/list/update/delete (HIGH)**
- Only `POST /teams` exists. No way to list, view, update, or delete teams.
- Admin page correctly shows "unavailable" but the backend is genuinely incomplete.

**FIND-BE-03: Tournaments controller lacks GET/list/update/delete (HIGH)**
- Only `POST /tournaments` exists. Same gap as teams.

**FIND-BE-04: Subscriptions controller lacks admin-scoped listing (HIGH)**
- `GET /subscriptions` returns only the authenticated user's subscriptions (`req.user.id`).
- No admin endpoint to list all subscriptions across users.

**FIND-BE-05: Reservation pending-payment expiry not enforced (HIGH)**
- `reservations.service.ts:43` sets `expires_at` to `Date.now() + 15 min`.
- No scheduled job, cron, or BullMQ processor expires stale `PENDING_PAYMENT` reservations.
- These reservations hold the GIST exclusion slot indefinitely until manually cancelled.

**FIND-BE-06: Reservations `findAllForAdmin()` response format unknown (MEDIUM)**
- `reservations.repository.ts` `findAll()` may return a flat array or paginated object.
- Admin `ReservationsPage.tsx` expects a flat `ReservationRow[]` from `GET /reservations`.
- If the repository returns `{ data, total }`, the page will break silently.

**FIND-BE-07: Payment `createPayment()` ignores the DTO (MEDIUM)**
- `payments.controller.ts:14` receives `CreatePaymentDto` but calls `this.paymentsService.createPayment()` with no arguments.
- The mock provider always returns a fail-closed response.

**FIND-BE-08: `UsersController.getProfile` uses `req.user.sub` (MEDIUM)**
- `users.controller.ts:30` calls `findById(req.user.sub)` — the JWT `sub` claim.
- Other controllers use `req.user.id`. If the JWT payload structure differs, this may fail silently.

---

## 2. Admin Frontend Audit (React 18 / Vite / TailwindCSS 3)

### 2.1 Architecture
- **API Client:** `admin/src/api/client.ts` — custom fetch wrapper, Bearer token from localStorage, error handling.
- **Auth:** `admin/src/context/AuthContext.tsx` — login via `/auth/login`, profile via `/users/profile`, role check for ADMIN/SUPER_ADMIN.
- **Layout:** Sidebar + Header + Outlet pattern. 13 nav items.
- **Pages:** 14 total (Login + 13 admin pages).
- **Components:** Badge, Modal, StatsCard, UnavailableFeature, AdminLayout, Header, Sidebar.

### 2.2 Page-by-Page Analysis

| Page | API Endpoint | Data Contract | Loading/Error/Empty | Action States | Verdict |
|---|---|---|---|---|---|
| LoginPage | `POST /auth/login`, `GET /users/profile` | Correct | ✅ | ✅ | **GOOD** |
| DashboardPage | None (navigation only) | N/A — honest disclaimer | ✅ | N/A | **GOOD** |
| StadiumsPage | `GET /stadiums?page=1&limit=100`, `PUT /stadiums/:id`, `PATCH /stadiums/:id/toggle-active` | Expects `{ data, total }` | ✅ | ✅ edit + toggle | **GOOD** |
| FieldsPage | `GET /stadiums`, `GET /fields?stadium_id=`, `POST /fields`, `PUT /fields/:id`, `PATCH /fields/:id/toggle-active` | Expects flat array from `/fields` | ✅ | ✅ create + edit + toggle | **GOOD** |
| ReservationsPage | `GET /reservations` | Expects flat `ReservationRow[]` — **may mismatch** | ✅ | Search + status filter | **RISK** |
| ClosuresPage | `GET /closures`, `POST /closures`, `GET /stadiums`, `GET /fields` | Correct | ✅ | ✅ create | **GOOD** |
| PricingPage | `GET /pricing`, `GET /seasons` | Expects flat arrays | ✅ | Read-only | **GOOD** |
| PaymentsPage | `GET /payments?limit=100&offset=0` | Expects flat `PaymentRow[]` — **may mismatch** | ✅ | Search only | **RISK** |
| UsersPage | `GET /users?limit=20&offset=0`, `PATCH /users/:id/toggle-active` | Expects `{ data, total }` | ✅ | ✅ pagination + toggle | **GOOD** |
| AuditLogsPage | `GET /audit?limit=100&offset=0` | Expects `{ data, total }` | ✅ | Read-only | **GOOD** |
| SubscriptionsPage | None | UnavailableFeature | N/A | N/A | **HONEST** |
| TeamsPage | None | UnavailableFeature | N/A | N/A | **HONEST** |
| TournamentsPage | None | UnavailableFeature | N/A | N/A | **HONEST** |
| SettingsPage | None | UnavailableFeature | N/A | N/A | **HONEST** |

### 2.3 Positive Findings
- No fake data is displayed anywhere. Pages that lack backend support show honest disclaimers.
- Loading, error, and empty states are consistently implemented on all data-driven pages.
- API client correctly handles auth token management and error extraction.
- Form validation defers to backend validation (via required attributes + server errors).
- CRUD operations optimistically update local state after confirmed server response.
- Stadium creation is honestly blocked with an explanation about missing commune API.

---

## 3. Mobile Application Audit (Flutter 3 / Dart 3)

### 3.1 Architecture
- **State Management:** Provider (ChangeNotifierProvider)
- **Networking:** Dio with `AuthInterceptor` for token injection/refresh
- **Routing:** GoRouter with auth redirect
- **Storage:** flutter_secure_storage for tokens
- **Features:** auth, stadiums, reservations, check_in, payments, profile (6 modules)

### 3.2 File Inventory (51 source files)
- Core: 15 files (constants, network, router, storage, theme, utils, widgets)
- Auth: 5 files (repository, models, provider, screens: login, register, OTP)
- Stadiums: 5 files (repository, models, provider, screens: list, detail)
- Reservations: 6 files (repository, models, provider, screens: create, list, detail)
- Check-in: 4 files (repository, provider, screens: guard_schedule, qr_scanner)
- Payments: 5 files (repository, models, provider, screens: payment, success)
- Profile: 1 file (profile_screen)

### 3.3 Key Findings
- **FIND-MOB-01:** No localization files (ARB) detected. All UI strings appear hardcoded. Arabic RTL is not functional.
- **FIND-MOB-02:** No subscription feature module exists in mobile.
- **FIND-MOB-03:** `PaymentSuccessScreen` may display success based on client-side navigation rather than confirmed backend status.
- **FIND-MOB-04:** `GuardScheduleScreen` exists but no backend endpoint for guard schedule is available.
- **FIND-MOB-05:** No notification UI screen exists (only provider/repository infrastructure).

---

## 4. Database Audit

Covered in detail in `02_DATABASE_AND_API_MAPPING.md`. Key facts:
- 24 tables with proper UUID PKs, foreign keys, and constraints.
- GIST exclusion constraint on `reservations` table prevents double-booking (verified by SQL tests).
- All enums defined as PostgreSQL custom types matching backend `common/enums.ts`.
- Monetary values use `NUMERIC(12,2)` with `DZD` currency default.
- Timestamps use `TIMESTAMPTZ` throughout.
- `idempotency_keys` table exists for payment deduplication.
- `payment_attempts` table tracks individual payment attempts.
- `verification_codes` table with hashed codes, attempt limits, and expiry.

---

## 5. Security Findings Summary

Covered in detail in `05_SECURITY_AND_RISK_REGISTER.md`. Key items:
- Production JWT secret validation exists and is tested.
- Argon2id password hashing (correct choice).
- Rate limiting via Redis-backed ThrottlerGuard on auth endpoints.
- QR tokens use separate signed JWT with 5-minute expiry.
- QR scan uses `FOR UPDATE` to prevent race conditions.
- Anti-replay: `status = 'CONFIRMED'` check in UPDATE WHERE clause.
- CORS configuration uses env-driven origins.
- Helmet enabled for HTTP security headers.
- Global ValidationPipe with whitelist + forbidNonWhitelisted.
- **Concern:** `req.user` typed as `any` in all controllers — no runtime type safety.

---

## 6. Testing Assessment

- Backend: 54 unit tests passing (mocked), 2 skipped, 2 isolated PG integration tests.
- Admin: 2 tests passing.
- Mobile: 2 tests passing.
- **No end-to-end tests exist.**
- **No live API contract tests exist.**
- **No load/stress tests exist.**
- Test coverage is not measured (no `--coverage` results available).

---

## 7. Deployment Assessment

- Docker Compose files exist for dev and prod.
- GitHub Actions CI/CD pipelines configured.
- Nginx reverse proxy template exists.
- Backup and restore scripts exist.
- **BLOCKED:** Docker Desktop is not running (WSL2 kernel update required).
- **BLOCKED:** No production infrastructure credentials available.
- **BLOCKED:** Android release signing not configured (debug only).
