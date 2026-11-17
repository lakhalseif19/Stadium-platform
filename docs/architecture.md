# System Architecture

## High-Level Architecture

The Stadium Reservation Platform follows a modern client-server architecture with a mobile-first approach.

```mermaid
flowchart TD
    subgraph Clients
        App[Flutter Mobile App\nUser / Admin / Guard]
        Web[Web Dashboard\nSuper Admin]
    end

    subgraph API Gateway & Load Balancer
        Nginx[NGINX / API Gateway]
    end

    subgraph Backend Services
        NodeAPI[Node.js REST API\nExpress / NestJS]
        Worker[BullMQ Worker\nBackground Jobs]
    end

    subgraph Data Layer
        DB[(PostgreSQL + PostGIS)]
        Cache[(Redis)]
    end

    subgraph External Services
        Payment[Payment Gateway]
        SMS[SMS / Email Service]
    end

    App --> Nginx
    Web --> Nginx
    Nginx --> NodeAPI
    NodeAPI --> DB
    NodeAPI --> Cache
    NodeAPI --> Worker
    Worker --> Cache
    Worker --> DB
    Worker --> SMS
    NodeAPI --> Payment
```

## Component Architecture

```mermaid
componentDiagram
    package "Frontend (Flutter)" {
        [Auth Module]
        [Booking Module]
        [Subscription Module]
        [QR Scanner Module]
    }
    
    package "Backend (Node.js)" {
        [Auth Controller]
        [Reservation Controller]
        [Stadium Controller]
        [Payment Webhook]
    }

    [Auth Module] --> [Auth Controller]
    [Booking Module] --> [Reservation Controller]
    [Subscription Module] --> [Payment Webhook]
```

## Technology Stack

- **Frontend:** Flutter (iOS/Android), Dart
- **Backend API:** Node.js, TypeScript, Express/NestJS
- **Database:** PostgreSQL 15+ with PostGIS extension for spatial queries (Sétif bounds)
- **Caching & Message Queue:** Redis, BullMQ
- **Authentication:** JWT (JSON Web Tokens), Argon2id for password hashing
- **Deployment:** Docker, Docker Compose, Linux VPS

## Data Flow: Reservation Process

```mermaid
sequenceDiagram
    actor User
    participant App
    participant API
    participant DB
    participant Payment
    
    User->>App: Select stadium, field & time slot
    App->>API: POST /api/reservations
    API->>DB: Check availability (GIST constraint)
    DB-->>API: Available
    API->>DB: Create pending reservation
    API-->>App: Return checkout URL
    App->>Payment: Redirect to payment
    Payment-->>API: Webhook (Payment Success)
    API->>DB: Update reservation status (CONFIRMED)
    API->>DB: Generate QR code JWT
    API-->>App: Notification / Ticket generated
```

## Module Structure
- **Users & Auth:** Handles registration, login, JWT issuance, RBAC.
- **Stadiums & Fields:** Manages hierarchy (Wilaya -> Commune -> Stadium -> Field).
- **Reservations & Subscriptions:** Core booking logic, conflict prevention (EXCLUDE USING GIST), 1-hour chunks.
- **Payments:** Webhook handlers for finalizing transactions.
- **Background Jobs:** Handling 15-day grace periods, releasing unpaid holds, materialized subscription generation.
