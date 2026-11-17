# Feature Matrix — Stadium Platform Sétif

**Audit date:** 2026-10-22

---

| Feature | Mobile | Admin | Backend | Database | Tests | Overall Status | Evidence |
|---|---|---|---|---|---|---|---|
| **Authentication** | | | | | | | |
| User registration | ✅ Screen | — | ✅ POST /auth/register | ✅ users table | ✅ Unit | IMPLEMENTED BUT UNVERIFIED | No live test |
| Login (phone/email + password) | ✅ Screen | ✅ LoginPage | ✅ POST /auth/login | ✅ users, Argon2id | ✅ Unit | IMPLEMENTED BUT UNVERIFIED | No live test |
| OTP verification | ✅ Screen | — | ✅ POST /auth/verify-otp | ✅ verification_codes | ✅ Unit | BLOCKED | No SMS/email provider |
| Token refresh | ✅ Interceptor | — | ✅ POST /auth/refresh | Redis storage | ✅ Unit | IMPLEMENTED BUT UNVERIFIED | No live Redis |
| Logout | — | ✅ Button | ✅ POST /auth/logout | Redis revocation | ✅ Unit | IMPLEMENTED BUT UNVERIFIED | — |
| Session restoration | ✅ SecureStorage | ✅ localStorage | ✅ JWT validation | — | — | IMPLEMENTED BUT UNVERIFIED | — |
| **Authorization** | | | | | | | |
| Role-based access (RBAC) | — | ✅ ProtectedRoute | ✅ RolesGuard | ✅ user_roles | ✅ Unit | PARTIALLY VERIFIED | Case mismatch risk |
| Permission-based access | — | — | ✅ PermissionsGuard | ✅ role_permissions | — | IMPLEMENTED BUT UNVERIFIED | — |
| Admin role check | — | ✅ ADMIN/SUPER_ADMIN | ⚠️ Mixed case | ✅ roles table | — | PARTIALLY VERIFIED | FIND-BE-01 |
| **Stadiums** | | | | | | | |
| List stadiums | ✅ Screen | ✅ Table | ✅ GET /stadiums | ✅ stadiums + communes JOIN | — | IMPLEMENTED BUT UNVERIFIED | — |
| View stadium details | ✅ Screen | — | ✅ GET /stadiums/:id | ✅ stadiums | — | IMPLEMENTED BUT UNVERIFIED | — |
| Create stadium | — | ❌ Blocked (no commune API) | ✅ POST /stadiums | ✅ stadiums | — | PARTIALLY IMPLEMENTED | Missing commune list API |
| Edit stadium | — | ✅ Modal form | ✅ PUT /stadiums/:id | ✅ stadiums | — | IMPLEMENTED BUT UNVERIFIED | — |
| Toggle stadium active | — | ✅ Button | ✅ PATCH /stadiums/:id/toggle-active | ✅ stadiums.is_active | — | IMPLEMENTED BUT UNVERIFIED | — |
| PostGIS proximity search | — | — | ✅ ST_DWithin | ✅ geography column + GIST index | — | IMPLEMENTED BUT UNVERIFIED | — |
| **Fields** | | | | | | | |
| List fields by stadium | ✅ Screen | ✅ Table | ✅ GET /fields?stadium_id= | ✅ fields | — | IMPLEMENTED BUT UNVERIFIED | — |
| Create field | — | ✅ Modal form | ✅ POST /fields | ✅ fields | — | IMPLEMENTED BUT UNVERIFIED | — |
| Edit field | — | ✅ Modal form | ✅ PUT /fields/:id | ✅ fields | — | IMPLEMENTED BUT UNVERIFIED | — |
| Toggle field active | — | ✅ Button | ✅ PATCH /fields/:id/toggle-active | ✅ fields.is_active | — | IMPLEMENTED BUT UNVERIFIED | — |
| **Reservations** | | | | | | | |
| View availability | ✅ Screen | — | ✅ GET /availability | ✅ reservations + closures | — | IMPLEMENTED BUT UNVERIFIED | — |
| Create reservation | ✅ Screen | — | ✅ POST /reservations (transactional) | ✅ GIST exclusion | ✅ PG integration | VERIFIED | Isolated PG test |
| List user reservations | ✅ Screen | — | ✅ GET /reservations/mine | ✅ reservations | — | IMPLEMENTED BUT UNVERIFIED | — |
| List all reservations (admin) | — | ✅ Table | ✅ GET /reservations (ADMIN) | ✅ reservations | — | IMPLEMENTED BUT UNVERIFIED | — |
| Cancel reservation | ✅ | — | ✅ DELETE /reservations/:id/cancel | ✅ status update | — | IMPLEMENTED BUT UNVERIFIED | — |
| Anti-double-booking | — | — | ✅ GIST constraint + transaction | ✅ EXCLUDE USING gist | ✅ SQL + PG | VERIFIED | Phase 5 integration test |
| August break enforcement | — | — | ✅ Service check (UTC month 7) | — | — | IMPLEMENTED BUT UNVERIFIED | — |
| 7-day booking window | — | — | ⚠️ Not found in code | — | — | MISSING | Only checks future date |
| 1-hour fixed duration | — | — | ✅ `start + 60min` | — | — | IMPLEMENTED BUT UNVERIFIED | reservations.service.ts:42 |
| Pending payment expiry (15 min) | — | — | ⚠️ expires_at set but not enforced | ✅ expires_at column | — | PARTIALLY IMPLEMENTED | No scheduled job |
| **Subscriptions** | | | | | | | |
| Create subscription | — | — | ✅ POST /subscriptions | ✅ subscriptions + subscription_slots | — | IMPLEMENTED BUT UNVERIFIED | — |
| List user subscriptions | — | ❌ UnavailableFeature | ✅ GET /subscriptions (user-scoped) | ✅ subscriptions | — | PARTIALLY IMPLEMENTED | No admin listing |
| Cancel subscription | — | — | ✅ DELETE /subscriptions/:id/cancel | ✅ status update | ✅ Unit | IMPLEMENTED BUT UNVERIFIED | — |
| Admin subscription listing | — | ❌ UnavailableFeature | ❌ Missing | ✅ subscriptions | — | MISSING | — |
| **Teams** | | | | | | | |
| Create team | — | ❌ UnavailableFeature | ✅ POST /teams (ADMIN) | ✅ teams | — | PARTIALLY IMPLEMENTED | — |
| List/edit/delete teams | — | ❌ UnavailableFeature | ❌ Missing | ✅ teams | — | MISSING | — |
| **Tournaments** | | | | | | | |
| Create tournament | — | ❌ UnavailableFeature | ✅ POST /tournaments (ADMIN) | ✅ tournaments + tournament_slots | — | PARTIALLY IMPLEMENTED | — |
| List/edit/delete tournaments | — | ❌ UnavailableFeature | ❌ Missing | ✅ tournaments | — | MISSING | — |
| **Closures** | | | | | | | |
| List closures | — | ✅ Table | ✅ GET /closures (ADMIN) | ✅ closures | — | IMPLEMENTED BUT UNVERIFIED | — |
| Create closure | — | ✅ Modal form | ✅ POST /closures (ADMIN) | ✅ closures | — | IMPLEMENTED BUT UNVERIFIED | — |
| **Pricing & Seasons** | | | | | | | |
| View pricing plans | — | ✅ Table | ✅ GET /pricing | ✅ pricing_plans | — | IMPLEMENTED BUT UNVERIFIED | — |
| View seasons | — | ✅ Cards | ✅ GET /seasons | ✅ seasons | — | IMPLEMENTED BUT UNVERIFIED | — |
| **Payments** | | | | | | | |
| Create payment | ✅ Screen | — | ✅ POST /payments (mock) | ✅ payments | — | BLOCKED | Mock provider only |
| List payments (admin) | — | ✅ Table | ✅ GET /payments (ADMIN) | ✅ payments | — | IMPLEMENTED BUT UNVERIFIED | — |
| Payment webhook | — | — | ✅ POST /payments/webhook (public) | ✅ payments + payment_attempts | — | BLOCKED | No real provider |
| Payment statistics | — | — | ✅ GET /payments/stats (ADMIN) | ✅ payments | — | IMPLEMENTED BUT UNVERIFIED | — |
| **QR Check-in** | | | | | | | |
| Generate QR token | ✅ | — | ✅ POST /check-in/qr (CITIZEN) | ✅ reservations + payments | ✅ Unit | IMPLEMENTED BUT UNVERIFIED | — |
| Guard scan QR | ✅ Scanner | — | ✅ POST /check-in/scan (GUARD) | ✅ reservations + audit_logs | ✅ Unit | IMPLEMENTED BUT UNVERIFIED | — |
| Anti-replay (FOR UPDATE) | — | — | ✅ Transactional | ✅ status check | ✅ Unit | IMPLEMENTED BUT UNVERIFIED | — |
| Time window validation | — | — | ✅ 15min before to end | — | — | IMPLEMENTED BUT UNVERIFIED | — |
| **Notifications** | | | | | | | |
| Create notification | — | — | ✅ Service | ✅ notifications | — | IMPLEMENTED BUT UNVERIFIED | — |
| List user notifications | — | — | ✅ Controller | ✅ notifications | — | IMPLEMENTED BUT UNVERIFIED | — |
| Push delivery | — | — | ❌ No provider | — | — | MISSING | — |
| **Audit** | | | | | | | |
| View audit logs | — | ✅ Table | ✅ GET /audit (admin) | ✅ audit_logs | — | IMPLEMENTED BUT UNVERIFIED | — |
| Write audit entries | — | — | ✅ Multiple services | ✅ audit_logs | — | IMPLEMENTED BUT UNVERIFIED | — |
| **Users** | | | | | | | |
| List users (admin) | — | ✅ Table + pagination | ✅ GET /users (admin) | ✅ users + user_roles | — | IMPLEMENTED BUT UNVERIFIED | — |
| Toggle user active | — | ✅ Button | ✅ PATCH /users/:id/toggle-active | ✅ users.is_active | — | IMPLEMENTED BUT UNVERIFIED | — |
| User profile | ✅ Screen | — | ✅ GET /users/profile | ✅ users | — | IMPLEMENTED BUT UNVERIFIED | — |
| **Localization** | | | | | | | |
| Arabic RTL | ❌ No ARB files | ❌ French only | N/A | N/A | — | MISSING | Mobile |
| French | ⚠️ Hardcoded | ✅ All labels | N/A | N/A | — | PARTIALLY IMPLEMENTED | — |
| English | ⚠️ Hardcoded | ❌ | N/A | N/A | — | MISSING | — |
| **Infrastructure** | | | | | | | |
| Docker dev | — | — | ✅ docker-compose.yml | — | — | IMPLEMENTED | — |
| Docker prod | — | — | ✅ docker-compose.prod.yml | — | — | IMPLEMENTED | — |
| CI/CD | — | — | ✅ ci.yml, deploy.yml | — | — | IMPLEMENTED | — |
| Health checks | — | — | ✅ /health, /live, /ready | — | — | IMPLEMENTED BUT UNVERIFIED | — |
| Swagger API docs | — | — | ✅ /api/docs | — | — | IMPLEMENTED BUT UNVERIFIED | — |
