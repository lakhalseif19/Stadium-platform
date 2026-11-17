# Stadium Platform Phase 2 Audit Checklist

Phase 3 status and final evidence for these items are recorded in [PHASE3_COMPLETION_REPORT.md](./PHASE3_COMPLETION_REPORT.md). That report supersedes the historical states below.

Status is based on checked-in source and commands run in this workspace. No live database or provider credentials were available; those items remain unverified.

| ID | Severity | Finding / root cause | State | Verification |
|---|---|---|---|---|
| AUTH-01 | High | Refresh rotation used a read/verify/write sequence, allowing concurrent reuse. | Fixed with Redis compare-and-set; regression test allows one of two concurrent refreshes. | `backend/test/auth.service.spec.ts`; full backend suite. |
| AUTH-02 | High | Access and refresh JWTs shared a secret and had no token-use claim; a refresh JWT could pass the access guard. | Fixed for newly issued tokens using `tokenType`; access guard requires `access`, refresh guard allows legacy tokens only while Redis hash validation succeeds. | `backend/test/authorization.spec.ts`; full backend suite. Legacy access JWTs refresh through the existing mobile refresh flow. |
| AUTH-03 | High | OTP attempt counting and successful consumption were separate Redis operations. | Fixed with atomic Redis scripts and a concurrent-consumption regression test. | `backend/test/auth.service.spec.ts`; full backend suite. |
| AUTH-04 | Medium | Production JWT secret validation ran before Nest loaded `.env`. | Fixed by running it in `ConfigModule` validation after environment loading. Local defaults remain available outside production. | `backend/test/production-secrets.spec.ts`; backend typecheck/build. |
| AUTH-05 | High | OTP delivery is not implemented. Registration commits the user before Redis OTP storage, so Redis failure can leave a registered but unverifiable phone account. | Blocked on a real SMS provider and a product-approved resend/recovery flow; errors do not report successful delivery. | Source inspection; no SMS credentials/provider available. |
| AUTH-06 | Medium | Throttling uses the Nest default in-memory storage, which is per-process and does not coordinate multiple backend instances. | Remaining; production multi-instance rate-limit coverage needs shared storage (Redis adapter/configuration). | `backend/src/app.module.ts`; no distributed deployment environment available. |
| AUTH-07 | Medium | Email-only registration has no email verification flow; phone verification is enforced only for phone login. | Remaining product/authentication policy decision and mail delivery dependency. | Auth source inspection. |
| PAY-01 | Critical | Payment SQL and idempotency handling disagree with checked-in schema (`payments.user_id`, idempotency response column/conflict target, attempt columns, pricing snapshot table/column). Live schema may differ. | Payment create and webhook return unavailable; no database/schema changes made. Reconciliation requires read-only live schema inspection and, if needed, explicit schema approval. | Payment service/controller tests; no live database/provider available. |
| PAY-02 | Critical | Mock provider could imply success without authenticated provider confirmation; mobile treated create response as success. | Payment UI now reports unavailable; create/webhook fail closed and mock webhook verification is false. | `backend/test/payments-service.spec.ts`, `backend/test/payments.spec.ts`, Flutter tests. |
| API-01 | High | Mobile sent QR scan field `qrToken`; backend DTO expects `token`. | Fixed request body to `token`. | Check-in source inspection; backend check-in tests; Flutter analysis/tests. |
| API-02 | Medium | Mobile called `/check-in/today`, with no backend route or documented schedule contract. | Removed the obsolete call; schedule screen explicitly states unavailable. No endpoint was invented. | Mobile controller/repository route comparison. |
| API-03 | High | Payment Flutter request/response model did not match backend and success was inferred from HTTP completion. | Submission UI is disabled while payment is unavailable. Provider contract remains blocked by PAY-01/02. | Flutter source and test/build checks. |
| RES-01 | High | Concurrent overlap safety depends on the checked-in PostgreSQL exclusion constraint. | Source code uses transaction/error mapping and ownership checks; live constraint and concurrent DB behavior remain unverified. No migration was applied. | Reservation unit tests; schema source inspection only. |
| SYS-01 | Medium | Backend has no ESLint configuration; admin has no test/lint scripts. | Remaining tooling gaps; existing static/build checks were run where available. | `npx eslint ...` reports missing config; admin `package.json` exposes build only. |
| SYS-02 | Medium | No isolated test database or integration-test configuration was found. | Live database integration tests not run; no destructive tests or database operations performed. | Backend package scripts and workspace inspection. |

## Flutter mobile endpoint inventory

All app requests use the configured API base URL (the backend global prefix is `/api/v1`). Route parameters and DTO shapes should be reviewed again when the provider/live database contracts become available.

| Mobile call | Backend route | State |
|---|---|---|
| `POST /auth/register` | `POST /api/v1/auth/register` | Present; OTP delivery is unavailable. |
| `POST /auth/login` | `POST /api/v1/auth/login` | Present. |
| `POST /auth/verify-otp` | `POST /api/v1/auth/verify-otp` | Present; six-digit DTO validation and atomic consume. |
| `POST /auth/refresh` | `POST /api/v1/auth/refresh` | Present; refresh guard and Redis token-hash check. |
| `POST /auth/logout` | `POST /api/v1/auth/logout` | Present; revokes stored refresh token. |
| `GET /stadiums` | `GET /api/v1/stadiums` | Present. |
| `GET /stadiums/:id` | `GET /api/v1/stadiums/:id` | Present. |
| `GET /fields?stadium_id=...` | `GET /api/v1/fields` | Present. |
| `GET /reservations/mine` | `GET /api/v1/reservations/mine` | Present. |
| `POST /reservations` | `POST /api/v1/reservations` | Present; server computes/validates booking, overlap depends on DB constraint. |
| `DELETE /reservations/:id/cancel` | `DELETE /api/v1/reservations/:id/cancel` | Present. |
| `GET /availability` | `GET /api/v1/availability` | Present. Live-data behavior not integration-tested. |
| `POST /check-in/scan` | `POST /api/v1/check-in/scan` | Present; body now uses `token`. |
| `POST /payments` | `POST /api/v1/payments` | Route exists but deliberately responds unavailable; mobile UI does not submit. |
| `/check-in/today` | No backend route | Removed from mobile; schedule API is not defined. |

## Verification record

- Backend: typecheck, build, and full Jest suite passed (9 suites, 32 tests).
- Admin: production build passed; no test or lint scripts are configured.
- Flutter: analysis clean, 2 tests passed, Android debug APK built.
- Live database, SMS, payment provider, and multi-instance Redis behavior remain unverified.
- Database operations performed: none.
