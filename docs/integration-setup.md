# External integration setup

This guide records the configuration the current source actually consumes. Setting credentials for a service that has no adapter does not activate that service.

## Backend production configuration

The backend requires the following values when `NODE_ENV=production`; startup rejects missing or insecure configuration:

| Variable | Used for | Requirement |
|---|---|---|
| `NODE_ENV` | Runtime mode | `production` |
| `DATABASE_URL` | PostgreSQL | Explicit PostgreSQL connection URL; the local default is not accepted in production |
| `REDIS_HOST` | Shared Redis used by throttling, OTP state, and BullMQ | Explicit shared Redis host |
| `REDIS_PORT` | Redis | Optional; defaults to `6379` |
| `REDIS_PASSWORD` | Authenticated Redis | Required in production |
| `JWT_ACCESS_SECRET` | Access-token signing | At least 32 characters and unique |
| `JWT_REFRESH_SECRET` | Refresh-token signing | At least 32 characters and different from the access key |
| `JWT_QR_SECRET` | QR signing | At least 32 characters and different from both token keys |
| `CORS_ORIGINS` | Browser API access | Comma-separated explicit HTTPS origins |
| `PORT` | HTTP listener | Optional; defaults to `3000` |

Use a secret manager or protected deployment environment variables. Do not commit actual values. The throttler, BullMQ connection, and Redis client currently use `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD`; `REDIS_URL` is not the active client setting. Deploy Redis as a shared authenticated service and verify multi-instance operation before production use.

For local development, copy the root `.env.example` to an ignored `.env`, replace its placeholders, then run only the development services described in `docker-compose.yml`. That compose file is development-only and must not be exposed to an untrusted network.

## CIB and Edahabia payments

Payment creation and webhooks intentionally return `503` until a trusted integration is implemented. No `PAYMENT_*` value currently activates a provider, and the backend payment repository is read-only. Do not mark a reservation paid from a browser redirect or mobile callback.

The official SATIM merchant page says online payment requires a contract with an acquiring bank, authorization from GIE Monétique, and technical certification with SATIM. Its web-merchant process requests an account, an application with the commercial registration, technical integration tests, and certification before the GIE authorization to enter operation: [SATIM online payment](https://satim.dz/index.php/fr/services-cib/paiement-en-ligne), [SATIM web-merchant integration](https://satim.dz/index.php/fr/e-paiement/integration-webmarchand). Algerian e-commerce law requires the online-payment platform to be operated by an authorized bank or Algérie Poste and requires a secured certified connection: [Ministry of Commerce, Law 18-05](https://www.commerce.gov.dz/media/reglementation/source/commerce-electronique/f2018028.pdf).

Before implementation, the owner must obtain from the acquiring bank / SATIM and, separately as applicable, Algérie Poste:

1. Merchant eligibility, registration, bank/postal settlement account, contract, and written approval for this business and website/app.
2. Official integration specifications for each card rail the merchant is approved to accept. Do not assume CIB approval also enables Edahabia acceptance.
3. Sandbox credentials, test cards, callback requirements, signature and status-query rules, refund/reversal behavior, and certification cases.
4. Production credentials and written production activation after acceptance tests.
5. The actual production database schema and a reviewed compatibility/migration plan. The checked-in schema differs from previously implemented payment write queries; those writes were removed while payment is disabled. No live schema was inspected.

Only after these inputs are received should a provider adapter, signature validation, replay protection, amount/currency binding, idempotency persistence, and refund reconciliation be implemented and tested. Callback URLs must be HTTPS and must come from the provider's official integration contract.

## SMS and email verification

There is no SMS or email delivery adapter and there are no active provider configuration keys. Registration returns `503` rather than creating an account whose OTP cannot be delivered. Adding an `SMS_API_KEY` or SMTP variables will not enable registration or verification.

The owner must select and contract an SMS provider that confirms delivery and sender requirements to Algerian `+213` destinations, and a transactional email provider with a verified sending domain. Obtain sandbox/prod credentials, sender identity, provider API documentation, delivery/error semantics, timeouts, and data-processing terms. Configure SPF, DKIM, and DMARC for the sending domain where the email provider supports them. The provider adapters and end-to-end delivery tests remain implementation work after the provider is selected; no successful message delivery is claimed.

## Android release signing

The debug build uses the template application ID. The owner must choose the official reverse-DNS application ID and create/provide a release keystore. Copy [`mobile/android/key.properties.example`](../mobile/android/key.properties.example) to ignored `mobile/android/key.properties`; fill in the actual `applicationId`, absolute `storeFile`, `storePassword`, `keyAlias`, and `keyPassword` locally. Keep the key and properties file out of source control; never use the debug key for publication. Follow [`mobile/android/RELEASE_SIGNING.md`](../mobile/android/RELEASE_SIGNING.md), then run `flutter build appbundle --release` from `mobile`.

## Safe database integration tests

The guarded backend integration runner starts a disposable PostgreSQL cluster under the operating-system temporary directory, checks loopback/database identity in the tests, runs integration tests against that database only, then stops and removes that generated temporary cluster. Run from `backend` with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-isolated-postgres-integration.ps1
```

Do not set `STADIUM_TEST_DATABASE_URL` yourself unless it refers to an explicitly isolated database named `stadium_phase3_test*` on loopback. No production credentials belong in this test configuration.
