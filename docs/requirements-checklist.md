# Requirements Checklist

| Requirement | Status |
| :--- | :--- |
| **Architecture & Structure** | |
| System architecture document with Mermaid diagrams | IN_PROGRESS |
| ADRs (PostgreSQL, BullMQ, Argon2id, etc.) | IN_PROGRESS |
| Database ER Diagram | IN_PROGRESS |
| API Endpoints documentation | IN_PROGRESS |
| **Business Rules** | |
| Sétif scope (V1) | IN_PROGRESS |
| Hierarchy: wilaya -> commune -> stadium -> field | IN_PROGRESS |
| Season: Sep 1 - Jul 31, August break | IN_PROGRESS |
| 7-day booking window | IN_PROGRESS |
| 1-hour single reservation limit | IN_PROGRESS |
| Coverage matrix (FULL/HALF_A/HALF_B) | IN_PROGRESS |
| Subscriptions (1/3/6/12 months, 100% upfront) | IN_PROGRESS |
| Materialized subscription slots | IN_PROGRESS |
| 15-day grace period for renewals | IN_PROGRESS |
| Teams logic (1-3 sessions/wk, max 1yr, admin) | IN_PROGRESS |
| Tournaments logic (conflict handling, admin) | IN_PROGRESS |
| Stadium closures | IN_PROGRESS |
| Payment flow & webhooks | IN_PROGRESS |
| QR check-in & signed JWT verification | IN_PROGRESS |
| Cancellation policies | IN_PROGRESS |
| **Infrastructure & Setup** | |
| docker-compose.yml (Postgres, Redis) | IN_PROGRESS |
| .env.example with placeholders | IN_PROGRESS |
| Comprehensive .gitignore | IN_PROGRESS |
| Professional README.md | IN_PROGRESS |
