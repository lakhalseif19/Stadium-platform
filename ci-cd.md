# CI/CD status

The root contains draft pipeline files (`ci.yml`, `security.yml`, and `deploy.yml`) and root-level deployment helpers. They are not active GitHub Actions workflows because `.github/workflows/` does not contain them. The workspace currently has no Git repository, so no workflow execution or remote deployment is claimed.

The draft deployment path was inconsistent with the checked-in tree: it referred to a missing `infrastructure/` directory. Phase 6 aligned those path references and the production Nginx template mount with the actual root-level files. The pipeline is still **blocked** because both `backend/Dockerfile` and `admin/Dockerfile` are missing and the deployment script references a nonexistent production migration runner/versioned migration set.

Do not copy or activate the draft deploy workflow until:

1. Container build definitions exist and build successfully from clean lockfiles.
2. The database migration strategy is implemented and reviewed for backward compatibility; a production database must not be used for first-run validation.
3. A separate staging database and deployment environment exist.
4. The GitHub environment secrets, registry permissions, host keys, domain, and HTTPS certificate are configured by their owners.
5. A staging deployment verifies health, authentication, reservations, authorized guard check-in, and payment-provider behavior without test credentials entering production.

The source checks that currently run locally are listed in [deployment.md](./docs/deployment.md). Security scans and local passing tests are not evidence of a deployed system.
