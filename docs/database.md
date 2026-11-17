# Database Documentation

## Entity-Relationship Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email
        string password_hash
        string role "USER, ADMIN, GUARD, SUPER_ADMIN"
        timestamp created_at
    }
    
    STADIUMS {
        uuid id PK
        string name
        uuid commune_id
        geometry location "PostGIS Point"
        boolean is_active
    }
    
    FIELDS {
        uuid id PK
        uuid stadium_id FK
        string name
        string type "5v5, 7v7, 11v11"
    }

    SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        uuid field_id FK
        timestamp start_date
        timestamp end_date
        string status "ACTIVE, EXPIRED, GRACE"
    }
    
    RESERVATIONS {
        uuid id PK
        uuid user_id FK
        uuid field_id FK
        uuid subscription_id FK "Nullable"
        timestamp start_time
        timestamp end_time
        string coverage "FULL, HALF_A, HALF_B"
        string status "PENDING, CONFIRMED, CANCELLED"
    }

    TEAMS {
        uuid id PK
        string name
        timestamp season_start
        timestamp season_end
    }

    USERS ||--o{ SUBSCRIPTIONS : has
    USERS ||--o{ RESERVATIONS : makes
    STADIUMS ||--o{ FIELDS : contains
    FIELDS ||--o{ RESERVATIONS : hosts
    SUBSCRIPTIONS ||--o{ RESERVATIONS : materializes
```

## Table Descriptions
- **Users**: Core identity table. Roles determine access levels. Password uses Argon2id.
- **Stadiums**: Physical locations. Requires PostGIS to validate bounds within Sétif.
- **Fields**: Sub-units of a stadium. Can be split into A/B for reservations.
- **Subscriptions**: Long-term recurring bookings.
- **Reservations**: The single source of truth for time slots. Contains both one-off bookings and materialized subscription slots.

## Key Constraints & GIST

To absolutely prevent double-booking, the `reservations` table utilizes PostgreSQL `EXCLUDE USING GIST`.

```sql
ALTER TABLE reservations
ADD CONSTRAINT prevent_overlapping_reservations
EXCLUDE USING GIST (
    field_id WITH =,
    tsrange(start_time, end_time) WITH &&
)
WHERE (status IN ('CONFIRMED', 'PENDING'));
```
*Note: The actual implementation will include logic to handle `FULL`, `HALF_A`, and `HALF_B` overlap via custom functions or mapping logic in the constraint.*

## Migration Strategy
- Migrations will be handled via Node.js migration tools (e.g., Knex or TypeORM migrations).
- PostGIS must be installed and initialized (`CREATE EXTENSION postgis;`) before the first schema migration.
- All primary keys are UUIDs, requiring `CREATE EXTENSION "uuid-ossp";`.
