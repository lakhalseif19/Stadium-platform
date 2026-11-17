# Stadium Reservation Platform (Sétif)

A modern, highly-available stadium reservation and management platform built specifically for the Sétif region in Algeria.

## Overview
This platform allows users to book local sports fields, manage long-term subscriptions, and provides administrators with powerful tools to manage schedules, tournaments, and facility closures. Security and accuracy are prioritized through rigorous database constraints and secure QR-code ticketing.

## Key Features
- **Spatial Validation:** PostGIS ensures stadiums are within Sétif limits.
- **Conflict Prevention:** PostgreSQL EXCLUDE constraints prevent double-booking at the database level.
- **Subscriptions:** Support for materialized recurring bookings (1, 3, 6, 12 months).
- **Secure Check-in:** Cryptographically signed JWT QR codes for offline validation by stadium guards.
- **Payment Webhooks:** Robust payment confirmation system via server-to-server communication.

## Tech Stack
- **Backend:** Node.js (TypeScript), Express/NestJS
- **Frontend:** Flutter (Mobile + Web)
- **Database:** PostgreSQL 15+ with PostGIS
- **Cache & Queue:** Redis, BullMQ
- **Infrastructure:** Docker, Docker Compose

## Quick Start (Development)

1. **Clone the repository**
2. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```
3. **Start infrastructure (Postgres + Redis):**
   ```bash
   docker-compose up -d
   ```
4. **Install dependencies:**
   ```bash
   npm install
   ```
5. **Run migrations:**
   ```bash
   npm run migrate
   ```
6. **Start development server:**
   ```bash
   npm run dev
   ```

## Documentation
Comprehensive documentation can be found in the `docs/` directory:
- [Architecture](docs/architecture.md)
- [Architecture Decisions (ADRs)](docs/architecture-decisions.md)
- [Business Rules](docs/business-rules.md)
- [Database Schema](docs/database.md)
- [API Reference](docs/api.md)
- [Security Model](docs/security.md)
- [Deployment Guide](docs/deployment.md)

## License
Proprietary - All rights reserved.
