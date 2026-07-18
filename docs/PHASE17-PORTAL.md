# Phase 17: Customer Portal & Mobile API

## Overview
Secure Customer Portal and Mobile API for customers, drivers, dispatchers, and third-party integrations. Optimized for mobile with offline sync support.

## Architecture

### Customer Portal
External customer-facing portal for shipment tracking, invoice management, and support.

| Page | Path | Features |
|------|------|----------|
| Dashboard | `/customer/dashboard` | Summary stats, recent shipments |
| Shipments | `/customer/shipments` | Active shipment list with tracking links |
| History | `/customer/history` | Completed/cancelled deliveries |
| Tracking | `/customer/tracking/[id]` | Live location, driver info, stops |
| Invoices | `/customer/invoices` | Invoice list with status |
| Support | `/customer/support` | Submit support tickets |
| Profile | `/customer/profile` | Update profile information |

### Mobile Driver API
API endpoints optimized for native mobile apps (Android/iOS/Flutter).

| Category | Endpoints |
|----------|-----------|
| **Auth** | `POST /api/mobile/auth/login` |
| **Trips** | `GET /api/mobile/trips`, `GET /api/mobile/trips/[id]`, `POST /api/mobile/trips/[id]/{accept,reject,start,pause,resume,complete}` |
| **GPS** | `POST /api/mobile/location`, `POST /api/mobile/location/batch` |
| **Vehicle** | `GET /api/mobile/vehicle`, `POST /api/mobile/vehicle/checklist`, `POST /api/mobile/vehicle/issue` |
| **Fuel** | `POST /api/mobile/fuel` |
| **Maintenance** | `POST /api/mobile/maintenance` |
| **Inspection** | `POST /api/mobile/inspection` |
| **Notifications** | `GET /api/mobile/notifications`, `POST /api/mobile/notifications/[id]` |
| **Sync** | `GET /api/mobile/sync`, `POST /api/mobile/sync` |
| **Profile** | `GET /api/mobile/profile`, `PATCH /api/mobile/profile` |
| **Emergency** | `POST /api/mobile/emergency` |

### Customer API
| Category | Endpoints |
|----------|-----------|
| **Auth** | `POST /api/customer/auth/login`, `POST /api/customer/auth/refresh`, `POST /api/customer/auth/logout`, `POST /api/customer/auth/password` |
| **Dashboard** | `GET /api/customer/dashboard` |
| **Shipments** | `GET /api/customer/shipments`, `GET /api/customer/shipments/history` |
| **Tracking** | `GET /api/customer/tracking/[id]`, `GET /api/customer/tracking/[id]/live` |
| **Invoices** | `GET /api/customer/invoices` |
| **Support** | `POST /api/customer/support` |
| **Profile** | `GET /api/customer/profile`, `PATCH /api/customer/profile` |

### Public API (Third-Party)
| Category | Endpoints |
|----------|-----------|
| **Trips** | `GET /api/public/v1/trips`, `GET /api/public/v1/trips/[id]` |
| **Vehicles** | `GET /api/public/v1/vehicles`, `GET /api/public/v1/vehicles/[id]/location` |
| **Drivers** | `GET /api/public/v1/drivers` |
| **Webhooks** | `GET /api/public/v1/webhooks`, `POST /api/public/v1/webhooks` |

Auth: `x-api-key` header + rate limiting

## Services

### CustomerAuthService
- Password-based auth using bcrypt
- JWT tokens (7-day expiry)
- Refresh tokens (30-day expiry)
- Password change support
- Stores credentials in customer metadata (no schema changes needed)

### CustomerPortalService
- Active shipment queries
- Delivery history with pagination
- Live tracking with vehicle location
- Invoice management
- Support ticket submission (via activity logs)
- Profile management

### MobileDriverService
- Trip lifecycle management (accept → start → pause → resume → complete)
- GPS location saving (single + batch)
- Vehicle checklist submission
- Issue reporting
- Fuel log submission
- Breakdown reporting
- Daily inspection submission
- Notification management
- Emergency SOS (creates incident)

### MobileSyncService
- Offline operation batch processing
- Conflict resolution
- Retryable error detection
- Initial sync state (trips, notifications, vehicle, inspections)

### PublicApiService
- API key validation (SHA-256 hash)
- Rate limiting (per-hour window)
- Request audit logging
- Webhook registration & delivery

## Security

### Authentication
| Portal | Method |
|--------|--------|
| Customer Portal | JWT (customer-specific, separate secret) |
| Driver Mobile | Same JWT as main app (x-user-id header) |
| Public API | API Key (x-api-key header) |

### Middleware
- `withCustomerAuth` - Validates customer JWT, extracts customerId + companyId
- `withAuth` (existing) - Used for driver mobile routes
- `PublicApiController.validateRequest` - Validates API key + rate limit

### Tenant Isolation
- All queries filter by `companyId`
- Customer routes validate `customerId` matches token
- Driver routes validate `driverId` matches token

## Offline Support Architecture

### Sync Operations
| Type | Description |
|------|-------------|
| `LOCATION` | GPS coordinates batch |
| `TRIP_STATUS` | Start/pause/complete |
| `FUEL_LOG` | Fuel purchase records |
| `CHECKLIST` | Vehicle inspection checklist |
| `INSPECTION` | Daily inspection |
| `MAINTENANCE` | Breakdown/issue reports |
| `ODOMETER` | Odometer readings |

### Sync Flow
1. Mobile app stores operations in local queue while offline
2. When online, sends batch to `POST /api/mobile/sync`
3. Server processes each operation in order
4. Returns results with SUCCESS/FAILED status
5. Failed operations marked as retryable where appropriate
6. `GET /api/mobile/sync?lastSync=` fetches server state for reconciliation

## API Versioning
- Public API uses `/api/public/v1/` path
- Future versions: `/api/public/v2/`
- Backward compatibility maintained through versioned paths

## Webhooks
- Event-driven notifications to external systems
- HMAC-SHA256 signature verification
- Retry logic for failed deliveries
- Supported events: trip.started, trip.completed, vehicle.location_updated

## Performance Optimizations
- Pagination on all list endpoints (default 20, max 100)
- Batch location updates (`/api/mobile/location/batch`)
- Efficient sync with `lastSync` timestamp
- Lightweight responses (select specific fields)

## Testing Strategy
- Unit tests for each service
- API integration tests for auth flows
- Mobile sync tests for offline queue
- Rate limiting tests for public API

## File Structure
```
src/modules/portal/
  services/
    customer-auth.service.ts
    customer-portal.service.ts
    mobile-driver.service.ts
    mobile-sync.service.ts
    public-api.service.ts
  controllers/
    customer.controller.ts
    mobile-driver.controller.ts
    public-api.controller.ts
  middleware/
    portal-auth.middleware.ts

src/app/api/mobile/
  auth/login/route.ts
  trips/route.ts
  trips/[id]/route.ts
  trips/[id]/{accept,reject,start,pause,resume,complete}/route.ts
  location/route.ts
  location/batch/route.ts
  vehicle/route.ts
  vehicle/checklist/route.ts
  vehicle/issue/route.ts
  fuel/route.ts
  maintenance/route.ts
  inspection/route.ts
  notifications/route.ts
  notifications/[id]/route.ts
  sync/route.ts
  profile/route.ts
  emergency/route.ts

src/app/api/customer/
  auth/{login,refresh,logout,password}/route.ts
  dashboard/route.ts
  shipments/route.ts
  shipments/history/route.ts
  tracking/[id]/route.ts
  tracking/[id]/live/route.ts
  invoices/route.ts
  support/route.ts
  profile/route.ts

src/app/api/public/v1/
  trips/route.ts
  trips/[id]/route.ts
  vehicles/route.ts
  vehicles/[id]/location/route.ts
  drivers/route.ts
  webhooks/route.ts

src/app/customer/
  layout.tsx
  dashboard/page.tsx
  shipments/page.tsx
  history/page.tsx
  tracking/[id]/page.tsx
  invoices/page.tsx
  support/page.tsx
  profile/page.tsx
```
