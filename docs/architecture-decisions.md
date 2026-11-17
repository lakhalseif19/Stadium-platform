# Architecture Decision Records (ADR)

## ADR-001: PostgreSQL + PostGIS over MongoDB
**Status:** Accepted
**Context:** The platform requires rigorous consistency for financial transactions and spatial hierarchy validation (Sétif region constraints).
**Decision:** We will use PostgreSQL with the PostGIS extension.
**Consequences:** Enables advanced spatial queries, robust ACID compliance, and robust concurrency control for bookings.

## ADR-002: Raw SQL / TypeORM for data access
**Status:** Accepted
**Context:** Need high performance and absolute control over complex queries (like GIST overlap queries).
**Decision:** Use a lightweight query builder or TypeORM with heavy reliance on raw SQL for critical reservation paths.
**Consequences:** Better performance for temporal-spatial overlap checks compared to pure ORM generation.

## ADR-003: BullMQ over Agenda/node-cron
**Status:** Accepted
**Context:** Subscriptions require delayed jobs, materialized view updates, and grace period expirations.
**Decision:** Use BullMQ backed by Redis.
**Consequences:** High reliability, exact-time job execution, and scalable worker architecture.

## ADR-004: Argon2id over bcrypt
**Status:** Accepted
**Context:** Storing user passwords securely is critical.
**Decision:** Use Argon2id instead of bcrypt.
**Consequences:** Better resistance against GPU/ASIC cracking attacks. Higher memory consumption during hashing.

## ADR-005: UUID over auto-increment
**Status:** Accepted
**Context:** Preventing resource enumeration (e.g., guessing reservation IDs).
**Decision:** Use UUIDv4 for all primary keys exposed to the client.
**Consequences:** Slightly larger index sizes but vastly improved security and distributed ID generation capabilities.

## ADR-006: EXCLUDE USING GIST for anti-double-booking
**Status:** Accepted
**Context:** Preventing double bookings across FULL/HALF_A/HALF_B coverages simultaneously is mathematically complex in application logic.
**Decision:** Use PostgreSQL `EXCLUDE USING GIST` constraints at the database level.
**Consequences:** Impossible to double-book, even under race conditions. Simplifies application code significantly.

## ADR-007: Materialized subscription occurrences
**Status:** Accepted
**Context:** Generating subscription schedules on-the-fly is computationally expensive and difficult to query against single bookings.
**Decision:** Materialize all subscription occurrences into the `reservations` table (with a subscription reference).
**Consequences:** Easy querying for availability, simple overlap checks, requires background jobs to materialize future occurrences periodically.

## ADR-008: Server-side pagination
**Status:** Accepted
**Context:** Returning large lists of stadiums or reservations degrades performance.
**Decision:** Standardize cursor-based or offset-based server-side pagination for all list endpoints.
**Consequences:** Consistent API responses, lower memory footprint on backend and frontend.

## ADR-009: Signed JWT for QR codes
**Status:** Accepted
**Context:** Stadium guards need offline/fast validation of tickets.
**Decision:** QR codes will contain a signed JWT encapsulating the reservation ID, time, and user.
**Consequences:** Guards can verify authenticity cryptographically without network dependency, though a network is required to check for last-minute cancellations.

## ADR-010: Payment webhook as source of truth
**Status:** Accepted
**Context:** Handling asynchronous payment failures/successes.
**Decision:** The system will rely purely on server-to-server webhooks from the payment provider to transition reservation statuses.
**Consequences:** Prevents client-side manipulation. Requires Ngrok for local testing.
