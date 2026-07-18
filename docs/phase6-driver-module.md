# Phase 6: Driver Management Module

## Overview

The Driver Management module provides complete fleet driver lifecycle management. Tracks driver profiles, license information, assignments, documents, and history with strict multi-tenant isolation.

## Folder Structure

```
src/
├── modules/driver/
│   ├── validators/
│   │   └── driver.validator.ts
│   ├── repositories/
│   │   └── driver.repository.ts
│   ├── services/
│   │   └── driver.service.ts
│   ├── controllers/
│   │   └── driver.controller.ts
│   └── __tests__/
│       └── driver.service.test.ts
├── app/
│   ├── api/drivers/
│   │   ├── route.ts                        (GET list, POST create)
│   │   ├── filters/route.ts                (GET filter options)
│   │   └── [id]/
│   │       ├── route.ts                    (GET/PUT/DELETE driver)
│   │       ├── assign/route.ts             (POST assign vehicle)
│   │       ├── unassign/route.ts           (POST unassign vehicle)
│   │       └── documents/
│   │           ├── route.ts                (GET/POST documents)
│   │           └── [documentId]/route.ts     (PUT/DELETE document)
│   └── dashboard/drivers/
│       ├── page.tsx                        (Driver list with filters)
│       ├── new/page.tsx                    (Create/Edit form)
│       ├── [id]/
│       │   ├── page.tsx                    (Detail with tabs)
│       │   ├── edit/page.tsx               (Re-exports new form)
│       │   └── documents/page.tsx          (Document management)
```

## API Endpoints

### Drivers
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | /api/drivers | List drivers (search + filter + pagination) | drivers:read |
| POST | /api/drivers | Create driver | drivers:create |
| GET | /api/drivers/:id | Get driver detail | drivers:read |
| PUT | /api/drivers/:id | Update driver | drivers:update |
| DELETE | /api/drivers/:id | Soft delete driver | drivers:delete |
| POST | /api/drivers/:id/assign | Assign vehicle | drivers:update |
| POST | /api/drivers/:id/unassign | Unassign vehicle | drivers:update |
| GET | /api/drivers/:id/documents | List documents | drivers:read |
| POST | /api/drivers/:id/documents | Add document | drivers:update |
| PUT | /api/drivers/:id/documents/:documentId | Update document | drivers:update |
| DELETE | /api/drivers/:id/documents/:documentId | Delete document | drivers:update |
| GET | /api/drivers/filters | Available filter values | drivers:read |

## Driver Status Lifecycle

```
[Create] --> ACTIVE
    |
    |--> [Suspend] --> SUSPENDED
    |--> [Leave] --> ON_LEAVE
    |--> [Deactivate] --> INACTIVE
    |--> [Terminate] --> TERMINATED (soft delete)
```

## Driver Assignment Flow

```
Admin
  |
  |-- POST /api/drivers/:id/assign
  |       { vehicleId, notes? }
  |
  v
Service
  |
  |-- 1. Find driver (tenant check)
  |-- 2. Verify driver is not already assigned
  |-- 3. Update driver.currentVehicleId
  |-- 4. Create DriverAssignment record
  |-- 5. Audit log
  |
  v
Response: { message: 'Driver assigned to vehicle successfully' }
```

## Document Management

Supported document types:
- LICENSE
- MEDICAL_CERTIFICATE
- TRAINING_CERTIFICATE
- BACKGROUND_CHECK
- DRUG_TEST
- INSURANCE

Each document supports:
- Title and URL
- Expiry date with visual warning when expired
- Reminder days for upcoming expiry notifications
- Soft delete (isActive flag)

## Search & Filters

### Supported Query Parameters
- `q` — Full-text search (name, email, license number, employee ID)
- `status` — Driver status filter
- `branchId` — Branch filter
- `departmentId` — Department filter
- `licenseClass` — License class filter
- `page` / `limit` — Pagination
- `sortBy` / `sortOrder` — Sorting

## Security

- ✅ Tenant isolation via `x-company-id` header
- ✅ RBAC permission checks on all routes
- ✅ Soft delete on drivers (status → TERMINATED)
- ✅ Audit logging on all mutations
- ✅ Zod validation on all inputs
- ✅ License number uniqueness per company
- ✅ Driver-vehicle assignment validation (one vehicle per driver at a time)

## Frontend Pages

| Page | Description |
|------|-------------|
| `/dashboard/drivers` | Table view with search, status filters, pagination, license expiry warnings |
| `/dashboard/drivers/new` | Multi-tab form (Personal Info, License, Work Details, Emergency, Notes) |
| `/dashboard/drivers/:id` | Detail page with Overview, Documents, History tabs |
| `/dashboard/drivers/:id/edit` | Edit form (reuses create form) |
| `/dashboard/drivers/:id/documents` | Full document list with expiry warnings |

## License Expiry Tracking

The driver list page automatically highlights expired licenses with a red badge. The detail page shows license status prominently. This enables proactive compliance management.
