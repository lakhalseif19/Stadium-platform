# Deployment readiness

The workspace contains a backend, Flutter mobile app, React/Vite admin app, a development PostgreSQL/Redis compose file, and an intended production compose file. Production deployment has **not** been verified and is currently blocked; do not use the deployment scripts against a live database until the blockers below are resolved.

## Current blockers

- `backend/Dockerfile` and `admin/Dockerfile` are absent, so the existing image build workflow cannot build its matrix images.
- The GitHub Actions YAML files (`ci.yml`, `security.yml`, `deploy.yml`) are at the workspace root. GitHub only discovers workflow files under `.github/workflows/`; there is no active workflow in this workspace.
- The deploy script invokes `migration:run:prod`, but `backend/src/database/run-migrations.ts` and versioned migration files are absent. The package script points to a nonexistent compiled path. No production schema operation has been run.
- Production environment values, TLS certificate, container registry credentials, domain, and live database schema have not been verified.
- The backend intentionally keeps registration and payment creation unavailable without real providers.

The deployment path references that could be corrected without applying database changes were aligned in Phase 6. That does not make deployment safe or executable until the missing build and migration pieces are supplied and verified.

## Production environment

Use a protected `.env.production` with `NODE_ENV=production`, `DATABASE_URL`, `REDIS_HOST`, `REDIS_PASSWORD`, distinct strong `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `JWT_QR_SECRET` values, and explicit HTTPS `CORS_ORIGINS`. The application fails startup when these required values are absent. Keep Postgres and Redis on a private network; expose only the HTTPS reverse proxy.

See [integration-setup.md](./integration-setup.md) for the exact active keys and the blocked SMS, email, CIB/Edahabia, and Android signing setup.

## Safe local checks

From `backend`:

```powershell
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test -- --runInBand
npm run build
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-isolated-postgres-integration.ps1
```

From `admin`:

```powershell
npm ci
npm run lint
npm run typecheck
npm run format:check
npm test
npm run build
```

From `mobile`:

```powershell
flutter pub get --enforce-lockfile
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
flutter build apk --debug
```

The isolated PostgreSQL runner creates and removes only its own generated temporary cluster. Never substitute a production connection string. Do not run `migration:run:prod`, seed scripts, restore scripts, or schema files against an existing database without a separately reviewed and authorized plan.
