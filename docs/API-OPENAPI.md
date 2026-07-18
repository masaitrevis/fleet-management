# OpenAPI 3.0.3 Specification - Fleet Management SaaS

## Info
- **Title**: Fleet Management SaaS API
- **Version**: 1.0.0
- **Description**: Multi-tenant fleet management platform API

## Servers
- `https://api.fleetmanagement.com`

## Authentication

### Bearer Auth (JWT)
```
Authorization: Bearer <token>
```
Used for: Customer Portal, Driver Mobile, Admin Dashboard

### API Key
```
X-API-Key: <api-key>
```
Used for: Public API (third-party integrations)

## Tags
- **Customer Portal** - Customer-facing operations
- **Driver Mobile** - Mobile app operations
- **Public API** - Third-party integrations

---

## Endpoints

### Customer Portal

#### POST /api/customer/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "customer@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "customer": { "id": "...", "name": "...", "email": "..." }
  }
}
```

#### GET /api/customer/dashboard
Get dashboard summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "activeShipments": 5,
    "completedDeliveries": 42,
    "totalInvoices": 12,
    "pendingInvoices": 3
  }
}
```

#### GET /api/customer/shipments
List active shipments.

**Query:** `?page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "tripNumber": "TRIP-001",
      "status": "IN_PROGRESS",
      "vehicle": { "registrationNumber": "KBC 123A", "make": "Toyota" },
      "driver": { "firstName": "John", "lastName": "Doe", "phone": "+254..." }
    }
  ]
}
```

#### GET /api/customer/tracking/:tripId
Get tracking details for a shipment.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "tripNumber": "TRIP-001",
    "status": "IN_PROGRESS",
    "vehicle": { ... },
    "driver": { ... },
    "tripStops": [...],
    "latestLocation": { "latitude": -1.2921, "longitude": 36.8219, "timestamp": "..." }
  }
}
```

#### GET /api/customer/tracking/:tripId/live
Get live vehicle location.

**Response:**
```json
{
  "success": true,
  "data": { "latitude": -1.2921, "longitude": 36.8219, "speed": 45, "timestamp": "..." }
}
```

#### GET /api/customer/invoices
List customer invoices.

**Response:**
```json
{
  "success": true,
  "data": { "items": [...], "total": 12, "page": 1, "limit": 20 }
}
```

#### POST /api/customer/support
Submit support request.

**Request:**
```json
{ "subject": "Issue with delivery", "message": "The package was damaged...", "tripId": "..." }
```

#### GET /api/customer/profile
Get customer profile.

#### PATCH /api/customer/profile
Update profile.

---

### Driver Mobile API

#### GET /api/mobile/trips
List assigned trips.

**Query:** `?status=IN_PROGRESS`

#### GET /api/mobile/trips/:id
Get trip details.

#### POST /api/mobile/trips/:id/accept
Accept a trip.

#### POST /api/mobile/trips/:id/reject
Reject a trip.

**Request:** `{"reason": "Vehicle issue"}`

#### POST /api/mobile/trips/:id/start
Start a trip.

**Request:** `{"odometer": 12345}`

#### POST /api/mobile/trips/:id/pause
Pause a trip.

**Request:** `{"reason": "Lunch break"}`

#### POST /api/mobile/trips/:id/resume
Resume a paused trip.

#### POST /api/mobile/trips/:id/complete
Complete a trip.

**Request:** `{"odometer": 12400, "notes": "Delivered successfully"}`

#### POST /api/mobile/location
Save single GPS location.

**Request:**
```json
{
  "latitude": -1.2921,
  "longitude": 36.8219,
  "speed": 45,
  "heading": 180,
  "accuracy": 5,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### POST /api/mobile/location/batch
Save batch GPS locations.

**Request:**
```json
{
  "locations": [
    { "latitude": -1.2921, "longitude": 36.8219, "timestamp": "..." },
    { "latitude": -1.2922, "longitude": 36.8220, "timestamp": "..." }
  ]
}
```

#### GET /api/mobile/vehicle
Get assigned vehicle details.

#### POST /api/mobile/vehicle/checklist
Submit pre-trip checklist.

#### POST /api/mobile/vehicle/issue
Report vehicle issue.

#### POST /api/mobile/fuel
Submit fuel log.

#### POST /api/mobile/maintenance
Report breakdown.

#### POST /api/mobile/inspection
Submit daily inspection.

#### GET /api/mobile/notifications
Get driver notifications.

#### POST /api/mobile/notifications/:id
Mark notification as read.

#### GET /api/mobile/sync
Get sync state.

**Query:** `?lastSync=2024-01-01T00:00:00Z`

#### POST /api/mobile/sync
Process sync batch.

**Request:**
```json
{
  "operations": [
    { "id": "op-1", "type": "LOCATION", "data": { ... }, "timestamp": "..." }
  ]
}
```

#### GET /api/mobile/profile
Get driver profile.

#### PATCH /api/mobile/profile
Update profile.

#### POST /api/mobile/emergency
Send emergency SOS.

**Request:**
```json
{
  "location": { "latitude": -1.2921, "longitude": 36.8219 },
  "reason": "Accident"
}
```

---

### Public API (v1)

#### GET /api/public/v1/trips
List trips (API key required).

#### GET /api/public/v1/trips/:id
Get trip by ID.

#### GET /api/public/v1/vehicles
List vehicles.

#### GET /api/public/v1/vehicles/:id/location
Get vehicle location.

#### GET /api/public/v1/drivers
List drivers.

#### GET /api/public/v1/webhooks
List webhooks.

#### POST /api/public/v1/webhooks
Register webhook.

**Request:**
```json
{
  "name": "My Integration",
  "url": "https://example.com/webhook",
  "events": ["trip.started", "trip.completed"],
  "secret": "optional-secret"
}
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input data |
| RATE_LIMITED | 429 | Too many requests |
| CONFLICT | 409 | Resource conflict |

## Rate Limits

| API | Limit | Window |
|-----|-------|--------|
| Customer Portal | 1000 | 1 hour |
| Driver Mobile | 2000 | 1 hour |
| Public API | 1000 | 1 hour |
