# API Documentation

## Base URL
`/api/v1`

## Authentication Flow
The API uses Bearer token authentication with JWT. 
Tokens are obtained via `/auth/login` and must be included in the `Authorization` header: `Bearer <token>`.

## Pagination
List endpoints support cursor-based or offset-based pagination.
Query params: `?limit=20&offset=0`

Response format:
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_next": true
  }
}
```

## Endpoints by Module

### Auth
- `POST /auth/register` - Register a new user.
- `POST /auth/login` - Authenticate and receive JWT.
- `GET /auth/me` - Get current user profile.

### Stadiums
- `GET /stadiums` - List stadiums (Filters: commune, date).
- `GET /stadiums/:id` - Get stadium details.
- `GET /stadiums/:id/fields` - List fields in a stadium.
- `GET /fields/:id/availability` - Get available 1-hour slots for a specific date range (max 7 days out).

### Reservations
- `POST /reservations` - Create a pending reservation. 
  - *Request:* `{"field_id": "uuid", "start_time": "ISO8601", "coverage": "FULL"}`
  - *Response:* `{"reservation_id": "uuid", "payment_url": "url"}`
- `GET /reservations` - List user's reservations.
- `GET /reservations/:id/qr` - Get the signed JWT QR code for check-in.
- `DELETE /reservations/:id` - Cancel reservation (if >24h away).

### Subscriptions
- `POST /subscriptions` - Request a subscription.
- `GET /subscriptions` - List user's active subscriptions.

### Webhooks
- `POST /webhooks/payment` - Payment gateway callback. Updates reservation status to CONFIRMED.

### Admin
- `POST /admin/teams` - Create a team.
- `POST /admin/closures` - Add a maintenance closure.

## Error Codes
- `400 Bad Request` - Validation errors.
- `401 Unauthorized` - Missing or invalid JWT.
- `403 Forbidden` - Insufficient permissions (e.g., User trying to access Admin route).
- `409 Conflict` - Double booking attempt.
- `422 Unprocessable Entity` - Business rule violation (e.g., booking > 7 days ahead).
- `500 Internal Server Error`
