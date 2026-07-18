# Phase 5: Vehicle Management Module

## Overview

The Vehicle Management module provides complete fleet vehicle lifecycle management for a multi-tenant SaaS. Supports fleets from 1 to 100,000+ vehicles per company with strict tenant isolation.

## Folder Structure

```
src/
├── modules/vehicle/
│   ├── validators/
│   │   └── vehicle.validator.ts
│   ├── repositories/
│   │   └── vehicle.repository.ts
│   ├── services/
│   │   └── vehicle.service.ts
│   ├── controllers/
│   │   └── vehicle.controller.ts
│   └── __tests__/
│       └── vehicle.service.test.ts
├── app/
│   ├── api/vehicles/
│   │   ├── route.ts                        (GET list, POST create)
│   │   ├── filters/route.ts                (GET filter options)
│   │   ├── categories/
│   │   │   ├── route.ts                    (GET/POST categories)
│   │   │   └── [id]/route.ts               (DELETE category)
│   │   └── [id]/
│   │       ├── route.ts                    (GET/PUT/DELETE vehicle)
│   │       ├── assign/route.ts             (POST assign driver)
│   │       ├── unassign/route.ts           (POST unassign driver)
│   │       ├── odometer/route.ts           (POST odometer reading)
│   │       ├── upload-image/route.ts       (POST image upload)
│   │       ├── images/[imageId]/route.ts   (DELETE image)
│   │       ├── documents/
│   │       │   ├── route.ts                (GET/POST documents)
│   │       │   └── [documentId]/route.ts   (PUT/DELETE document)
│   │       └── history/route.ts            (GET assignment history)
│   └── dashboard/vehicles/
│       ├── page.tsx                        (Vehicle list + filters)
│       ├── new/page.tsx                    (Create/Edit form)
│       ├── [id]/
│       │   ├── page.tsx                    (Detail with tabs)
│       │   ├── edit/page.tsx               (Re-exports new form)
│       │   ├── documents/page.tsx          (Document management)
│       │   └── history/page.tsx            (Timeline view)
```

## API Endpoints

### Vehicles
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | /api/vehicles | List vehicles (search + filter + pagination) | vehicles:read |
| POST | /api/vehicles | Create vehicle | vehicles:create |
| GET | /api/vehicles/:id | Get vehicle detail | vehicles:read |
| PUT | /api/vehicles/:id | Update vehicle | vehicles:update |
| DELETE | /api/vehicles/:id | Soft delete vehicle | vehicles:delete |
| POST | /api/vehicles/:id/assign | Assign driver | vehicles:update |
| POST | /api/vehicles/:id/unassign | Unassign driver | vehicles:update |
| POST | /api/vehicles/:id/odometer | Add odometer reading | vehicles:update |
| POST | /api/vehicles/:id/upload-image | Upload vehicle image | vehicles:update |
| DELETE | /api/vehicles/:id/images/:imageId | Delete image | vehicles:update |
| GET | /api/vehicles/:id/documents | List documents | vehicles:read |
| POST | /api/vehicles/:id/documents | Add document | vehicles:update |
| PUT | /api/vehicles/:id/documents/:documentId | Update document | vehicles:update |
| DELETE | /api/vehicles/:id/documents/:documentId | Delete document | vehicles:update |
| GET | /api/vehicles/:id/history | Assignment history | vehicles:read |
| GET | /api/vehicles/filters | Available filter values | vehicles:read |
| GET | /api/vehicles/categories | List categories | vehicles:read |
| POST | /api/vehicles/categories | Create category | vehicles:update |
| DELETE | /api/vehicles/categories/:id | Delete category | vehicles:update |

## Vehicle Lifecycle

```
[Create] --> ACTIVE / AVAILABLE
    |
    |--> [Assign Driver] --> ASSIGNED
    |--> [Unassign] --> AVAILABLE
    |--> [Maintenance] --> IN_MAINTENANCE / MAINTENANCE
    |--> [Reserve] --> RESERVED
    |--> [Decommission] --> OUT_OF_SERVICE
    |--> [Sell] --> SOLD
    |--> [Scrap] --> SCRAPPED
    |--> [Report Stolen] --> STOLEN
```

## Vehicle Assignment Flow

```
Admin
  |
  |-- POST /api/vehicles/:id/assign
  |       { driverId, branchId?, departmentId?, notes? }
  |
  v
Service
  |
  |-- 1. Find vehicle (tenant check)
  |-- 2. End current assignment (if any)
  |-- 3. Update vehicle.currentDriverId + availability = ASSIGNED
  |-- 4. Create VehicleAssignment record
  |-- 5. Audit log
  |
  v
Response: { message: 'Vehicle assigned successfully' }
```

## Document Management Flow

```
User
  |
  |-- POST /api/vehicles/:id/documents
  |       { type, title, url, expiryDate?, renewalDate?, reminderDays }
  |
  v
Service
  |
  |-- 1. Verify vehicle ownership (tenant check)
  |-- 2. Create VehicleDocument
  |-- 3. Audit log
  |
  v
Document stored with expiry tracking for future reminders
```

## File Upload Strategy

1. **Frontend**: User selects file via `<input type="file" />`
2. **API**: `POST /api/vehicles/:id/upload-image` accepts multipart/form-data
3. **Service**: File uploaded to Cloudinary (configured in production)
4. **Database**: `VehicleImage` record stores URL, thumbnail, and isPrimary flag
5. **Primary Image**: Only one image per vehicle can be primary; used for list/card thumbnails

## Odometer Tracking

- `OdometerReading` records every update with source (MANUAL, GPS, FUEL_ENTRY, TRIP)
- `Vehicle.odometer` always reflects the latest reading
- Validation: New reading must be >= current reading (prevents rollback)
- Automatic updates planned for future GPS integration

## Search & Filters

### Supported Query Parameters
- `q` — Full-text search (registration, plate, VIN, make, model)
- `status` — Vehicle status filter
- `category` — Vehicle category filter
- `make` — Make filter
- `model` — Model filter
- `fuelType` — Fuel type filter
- `branchId` — Branch filter
- `departmentId` — Department filter
- `yearFrom` / `yearTo` — Year range
- `assignedDriverId` — Driver filter
- `availability` — Availability filter
- `page` / `limit` — Pagination
- `sortBy` / `sortOrder` — Sorting

### Filter Options Endpoint
`GET /api/vehicles/filters` returns all unique values for:
- makes, models, years, statuses, fuelTypes, categories

## Vehicle Categories

### System Categories
- TRUCK, BUS, VAN, PICKUP, SUV, SEDAN, MOTORCYCLE, TRAILER, HEAVY_EQUIPMENT

### Custom Categories
Companies can create custom categories via `POST /api/vehicles/categories`

## Security

- ✅ Tenant isolation via `x-company-id` header
- ✅ RBAC permission checks on all routes
- ✅ Soft delete on vehicles (status → OUT_OF_SERVICE, availability → OFFLINE)
- ✅ Audit logging on all mutations
- ✅ Zod validation on all inputs
- ✅ Plate/VIN uniqueness validation per company
- ✅ Odometer rollback prevention

## Reports (API-Ready)

These aggregations are supported by the repository layer:
- Total Vehicles — `count()` with tenant filter
- Vehicles by Status — group by `status`
- Vehicles by Category — group by `category`
- Vehicles by Branch — group by `branchId`
- Vehicles by Fuel Type — group by `fuelType`
- Vehicle Age Report — calculate from `year`
- Registration Expiry — query `VehicleDocument` with type `ROAD_LICENSE`
- Insurance Expiry — query `VehicleDocument` with type `INSURANCE`

## Frontend Pages

| Page | Description |
|------|-------------|
| `/dashboard/vehicles` | Grid view with search, filters, pagination, status badges |
| `/dashboard/vehicles/new` | Multi-tab form (Basic Info, Specs, Ownership, Purchase) |
| `/dashboard/vehicles/:id` | Detail page with Overview, Specs, Documents, History, Images tabs |
| `/dashboard/vehicles/:id/edit` | Edit form (reuses create form) |
| `/dashboard/vehicles/:id/documents` | Full document list with expiry warnings |
| `/dashboard/vehicles/:id/history` | Timeline view of assignments and odometer updates |

## Reusable Components (Inline)

- **VehicleCard** — Grid card with status badge, color indicator, quick actions
- **StatusBadge** — Status icon + color mapping
- **FilterPanel** — Dropdown filters for make, model, status, category, fuel type
- **Timeline** — Vertical timeline with event icons and metadata
- **ImageGallery** — Grid with primary badge, hover delete, upload button
