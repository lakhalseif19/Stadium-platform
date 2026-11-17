# Stadium Platform Sétif — Engineering Audit

Audit date: 2026-10-16. This snapshot reflects source inspection and commands actually run; it is not a production-readiness certification.

## Architecture

- `backend/`: NestJS 10, TypeScript, PostgreSQL (`pg`), Redis/BullMQ, Jest.
- `mobile/`: Flutter, Provider, Dio, GoRouter, Android application.
- `admin/`: React 18, TypeScript, Vite.
- `database/`: PostgreSQL schema and SQL seed scripts. Existing developer database is not modified.

## Implemented surface

The backend contains auth, users/RBAC, stadiums, fields, availability/reservations, pricing/seasons, subscriptions, teams/tournaments, closures, payments, check-in, notifications, and audit modules. Mobile has auth, stadium, reservation, check-in, and payment feature structure. Admin has login and operational pages. Schema defines core entities and a partial GiST exclusion constraint protecting active reservation overlaps.

## Confirmed defects / gaps

- Authorization decorators were present, but no global guards were installed; many decorated endpoints therefore did not enforce roles/permissions. JWT payloads use `sub`, whereas some controllers read `user.id`.
- Reservation cancellation was a stub; reservation creation accepted a client-selected `user_id`, did not validate a valid future time, and mapped every slot to one hour.
- Flutter scanner 3.5.7's Android library module uses compile SDK 33, incompatible with dependencies requiring newer SDK metadata. The earlier notification compiler ambiguity was addressed with `flutter_local_notifications 17.2.4`; NDK was not changed.
- Flutter's sample widget test instantiated nonexistent `MyApp`; mobile API URL was emulator-only and Dio logged request/response bodies.
- Admin includes sample/demo data in several operational pages and default-looking credentials in its login form; these must not be represented as live operational data.
- Payment provider is a mock; OTP generation stores a code but has no delivery provider. Real payment/OTP delivery is therefore not configured.
- No admin test/lint scripts are configured. Existing audit/status documents predate the populated applications and are stale.

## Baseline verification

- Backend `npm run typecheck`: passed.
- Backend `npm run build`: passed.
- Backend Jest: 3 suites passed; auth suite timed out in Argon2 hashing (11/12 tests passed; rerun required).
- Admin `npm run build`: passed.
- Flutter analyze/test: failed due to the stale `MyApp` sample test (analyzer also reported non-fatal lints/info).
- Flutter debug APK: notification Java ambiguity was no longer the blocker; build failed at `:mobile_scanner:checkDebugAarMetadata` because the plugin's Android compile SDK is too old.

## Remediation order

1. Enforce authentication/RBAC centrally and normalize the authenticated user identity.
2. Close reservation ownership/cancellation/time validation gaps while retaining database overlap protection.
3. Upgrade the Android scanner package only, migrate its API if needed, repair mobile configuration/test and rerun the requested Flutter command sequence.
4. Remove misleading demo credentials/data and sensitive request/response logging; document externally configured integrations.
5. Re-run backend/admin/mobile checks; record unresolved environment, policy, and provider prerequisites without claiming end-to-end completion.

## Work performed in this repair pass

- Installed global JWT, role, and permission guards; normalized role comparisons and expose JWT subject as `req.user.id` for existing controllers.
- Enforced future reservation starts, blocked non-admin requests to reserve on behalf of another user, mapped PostgreSQL overlap/uniqueness conflicts to HTTP conflict, and implemented owner-only cancellation before a reservation starts. The existing August restriction is preserved.
- Added user-scoped and admin-only reservation listing. Admin reservations now load backend data; dashboard demo metrics were removed. Default-looking login field values and verbose Dio request/response logging were removed.
- Updated `mobile_scanner` from 3.5.7 to 7.4.2 after reviewing the [package changelog](https://pub.dev/packages/mobile_scanner/changelog); current QR callback remains API-compatible. Added configurable `API_BASE_URL`, Android Internet/Camera permissions, and replaced the invalid counter sample with a signed-out app smoke test.
- No schema or database operation was performed. Financial/occupancy dashboard metrics, remaining demo-backed admin pages, real payment processing, and OTP delivery remain incomplete/unconfigured.

## Current verification

- `flutter pub get`: passed; resolved `mobile_scanner 7.4.2`.
- `flutter analyze`: failed (exit 1); 34 info-level diagnostics remain (style/API usage suggestions; no errors or warnings). Analyzer output is not suppressed.
- `flutter test`: passed (exit 0; 1 widget test).
- `flutter build apk --debug`: passed (exit 0); artifact `mobile/build/app/outputs/flutter-apk/app-debug.apk`.
- Backend `npm run typecheck`: passed (exit 0).
- Backend `npm run build`: passed (exit 0).
- Backend `npm test -- --runInBand`: passed (exit 0; 4 suites, 12 tests). npm printed an unknown CLI config warning for forwarded Jest arguments; Jest still ran the complete configured suite successfully.
- Admin `npm run build`: passed (exit 0; TypeScript and Vite production build).

## Remaining blockers / limitations

- No database-backed integration or concurrent-booking test was run. The developer database was intentionally left untouched; use a disposable test database before validating real PostgreSQL constraints.
- Real payment processing and OTP message delivery are unavailable because provider configuration is absent; mock/payment and OTP code paths are not evidence of live transactions or delivery.
- Several admin pages outside the dashboard/reservation view still contain demonstration data or lack complete API workflows. The dashboard intentionally discloses that live occupancy/revenue metrics are not yet available.
- No release signing, production HTTPS deployment, or end-to-end mobile/admin workflow was performed. This is a partial repair, not a production-readiness sign-off.

## Local development notes

- Backend: `cd backend; npm run start:dev` (populate local environment from `.env.example`; never copy secrets into reports).
- Admin: `cd admin; npm run dev` (set `VITE_API_URL` if the backend is not at its local default).
- Mobile emulator: `cd mobile; flutter run`.
- Physical Android device: `cd mobile; flutter run --dart-define=API_BASE_URL=http://<LAN-HOST>:3000/api/v1` with the backend reachable on the same network. Use an HTTPS URL for release builds; do not expose a development API over an untrusted network.
- Debug APK: `cd mobile; flutter build apk --debug`.
- Release signing and a real HTTPS deployment have not been validated.

## Data safety

No database was altered, migrated, seeded, reset, or queried for this audit. Schema/migration edits, if any, must be separately reviewed and must preserve existing data.
