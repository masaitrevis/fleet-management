# Phase 2: Suggested Migration Order

## Overview

When running `prisma migrate dev` (or deploying migrations with `prisma migrate deploy`), the order of table creation matters due to foreign key constraints. PostgreSQL requires that referenced tables exist before tables that reference them.

This document provides the recommended migration order and grouping strategy for a clean, reliable deployment.

---

## Migration Strategy

Prisma migrations are generated automatically based on the schema, but understanding the order helps with:
- Manual migration scripts for complex environments
- Debugging migration failures
- Seeding data in the correct order
- Partitioning setup (which requires tables to exist first)

---

## Migration Order (Dependency-Based)

### Phase 1: Foundation (No Dependencies)

These tables have no foreign keys and must be created first:

1. **Company** — The root tenant entity. No foreign keys.
2. **User** — Global user accounts. No foreign keys.
3. **Permission** — Global permission lookup. No foreign keys.
4. **SubscriptionPlan** — SaaS pricing tiers. No foreign keys.

### Phase 2: Platform Layer (Depends on Phase 1)

These tables reference Company, User, or SubscriptionPlan:

5. **CompanyUser** — References: User, Company
6. **Role** — References: Company (optional)
7. **UserRole** — References: User, Role, Company
8. **Session** — References: User
9. **RefreshToken** — References: User
10. **CompanySubscription** — References: Company, SubscriptionPlan

### Phase 3: Fleet Foundation (Depends on Phase 2)

These tables reference Company:

11. **VehicleCategory** — References: Company
12. **VehicleType** — References: Company, VehicleCategory (optional)
13. **GPSDevice** — References: Company
14. **ServiceCenter** — References: Company

### Phase 4: Core Fleet (Depends on Phase 3)

These tables reference Company, VehicleType, VehicleCategory, etc.:

15. **Driver** — References: Company, User (optional)
16. **Vehicle** — References: Company, VehicleType (optional), VehicleCategory (optional), GPSDevice (optional), Driver (optional)
17. **DriverLicense** — References: Driver

### Phase 5: Operations (Depends on Phase 4)

These tables reference Vehicle, Driver, Company:

18. **VehicleAssignment** — References: Vehicle, Driver
19. **Route** — References: Company
20. **RouteStop** — References: Route
21. **Waypoint** — References: Route
22. **Trip** — References: Company, Vehicle, Driver, Route (optional)
23. **TripStop** — References: Trip, RouteStop (optional)
24. **Geofence** — References: Company
25. **FuelLog** — References: Company, Vehicle, Driver (optional), Trip (optional)
26. **OdometerReading** — References: Company, Vehicle, Driver (optional), Trip (optional)

### Phase 6: Maintenance (Depends on Phase 4)

These tables reference Vehicle, ServiceCenter:

27. **MaintenanceSchedule** — References: Company, Vehicle
28. **MaintenanceRecord** — References: Company, Vehicle, MaintenanceSchedule (optional), ServiceCenter (optional)
29. **SparePart** — References: Company, MaintenanceRecord
30. **MaintenanceCost** — References: Company, MaintenanceRecord

### Phase 7: Documents (Depends on Phase 4)

These tables reference Vehicle, Driver:

31. **VehicleDocument** — References: Company, Vehicle
32. **DriverDocument** — References: Company, Driver
33. **Insurance** — References: Company, Vehicle
34. **Inspection** — References: Company, Vehicle

### Phase 8: Finance (Depends on Phase 5/6)

These tables reference Company, Trip, etc.:

35. **Customer** — References: Company
36. **Invoice** — References: Company, Customer (optional), CompanySubscription (optional)
37. **Payment** — References: Company, Invoice (optional), Customer (optional)
38. **Expense** — References: Company, Trip (optional), Customer (optional), Invoice (optional)

### Phase 9: Real-Time & Communication (Depends on Phase 4/5)

39. **VehicleLocation** — References: Company, Vehicle, GPSDevice (optional)
40. **GeofenceAlert** — References: Geofence, Vehicle, Driver (optional)
41. **Notification** — References: Company, User (optional), Driver (optional)
42. **NotificationPreference** — References: Company, User

### Phase 10: Auditing & SaaS (Depends on Phase 1/2)

43. **AuditLog** — References: Company, User (optional)
44. **ActivityLog** — References: Company, User (optional), Driver (optional)
45. **APIKey** — References: Company, User
46. **Webhook** — References: Company

---

## Visual Migration Dependency Graph

```
Phase 1: Foundation
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐
│ Company │  │  User   │  │Permission│  │SubscriptionPlan │
└────┬────┘  └────┬────┘  └─────────┘  └─────────────────┘
     │            │
     ▼            ▼
Phase 2: Platform Layer
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────────┐
│CompanyUser│  │  Role   │  │UserRole │  │ Session │  │CompanySubscription│
└─────────┘  └─────────┘  └─────────┘  └─────────┘  └──────────────────┘
     │
     ▼
Phase 3: Fleet Foundation
┌──────────────┐  ┌────────────┐  ┌──────────┐  ┌─────────────┐
│VehicleCategory│  │VehicleType │  │GPSDevice │  │ServiceCenter│
└──────────────┘  └────────────┘  └──────────┘  └─────────────┘
     │                   │
     │                   ▼
     │            ┌─────────┐
     │            │ Vehicle │
     ▼            └────┬────┘
     │                 │
     │                 ▼
     │            ┌─────────┐
     │            │ Driver  │◄──┐
     │            └────┬────┘   │
     │                 │       │
     ▼                 ▼       │
Phase 4: Core Fleet
┌────────────┐  ┌──────────────┐  ┌──────────┐
│DriverLicense│  │VehicleAssignment│  │Geofence  │
└────────────┘  └──────────────┘  └──────────┘
     │
     ▼
Phase 5: Operations
┌────────┐  ┌──────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌──────────────┐
│ Route  │  │ RouteStop │  │Waypoint│  │  Trip  │  │TripStop│  │VehicleLocation│
└────────┘  └──────────┘  └────────┘  └────────┘  └────────┘  └──────────────┘
     │                                           │
     │            ┌──────────┐                  │
     │            │ FuelLog  │                  │
     │            │OdometerReading│              │
     │            └──────────┘                  │
     │                                           │
     ▼                                           ▼
Phase 6: Maintenance
┌──────────────────┐  ┌─────────────────┐  ┌──────────┐  ┌──────────────┐
│MaintenanceSchedule│  │MaintenanceRecord│  │SparePart │  │MaintenanceCost│
└──────────────────┘  └─────────────────┘  └──────────┘  └──────────────┘
     │
     ▼
Phase 7: Documents
┌──────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐
│VehicleDocument│  │DriverDocument │  │Insurance │  │Inspection│
└──────────────┘  └─────────────┘  └──────────┘  └──────────┘
     │
     ▼
Phase 8: Finance
┌──────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│ Customer │  │ Invoice │  │ Payment │  │ Expense │
└──────────┘  └────────┘  └────────┘  └────────┘
     │
     ▼
Phase 9: Communication
┌──────────────┐  ┌────────────────────┐  ┌────────────┐
│ Notification │  │NotificationPreference│  │GeofenceAlert│
└──────────────┘  └────────────────────┘  └────────────┘
     │
     ▼
Phase 10: Auditing & SaaS
┌──────────┐  ┌──────────┐  ┌────────┐  ┌────────┐
│ AuditLog │  │ActivityLog│  │ APIKey │  │ Webhook │
└──────────┘  └──────────┘  └────────┘  └────────┘
```

---

## Prisma Migration Commands

### Development (with auto-generated migration)
```bash
npx prisma migrate dev --name init
```

Prisma will automatically determine the correct order based on foreign key dependencies. The above breakdown is primarily for understanding and manual intervention if needed.

### Production Deployment
```bash
npx prisma migrate deploy
```

This applies all pending migrations in order. Safe for CI/CD pipelines.

### Generate Prisma Client
```bash
npx prisma generate
```

Must be run after any schema change.

---

## Seeding Order

After migrations, seed data in this order:

1. **System Permissions** — Insert all permission codes into `Permission` table
2. **System Roles** — Insert Super Admin, Platform Admin, etc. with null `companyId`
3. **System Plans** — Insert SubscriptionPlan records (Free, Starter, Pro, Enterprise)
4. **Demo Company** — Insert a demo company with ACTIVE status
5. **Default Roles** — Insert company-specific default roles (Owner, Admin, Fleet Manager, Driver, etc.) linked to the demo company
6. **Demo Users** — Insert admin user and link to demo company via CompanyUser
7. **User Roles** — Assign system/default roles to demo users
8. **Vehicle Categories** — Insert standard categories (Light Duty, Heavy Duty, Passenger)
9. **Vehicle Types** — Insert common vehicle types
10. **Service Centers** — Insert demo service centers
11. **Drivers** — Insert demo drivers
12. **Vehicles** — Insert demo vehicles (link to drivers and types)
13. **Driver Licenses** — Insert license records for demo drivers
14. **Routes** — Insert demo routes with stops
15. **Trips** — Insert demo trips
16. **Maintenance Schedules** — Insert recurring maintenance schedules
17. **Documents** — Insert demo vehicle and driver documents
18. **Customers** — Insert demo customers
19. **Invoices** — Insert demo invoices and payments
20. **Geofences** — Insert demo geofences

### Seed Script Example
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. Permissions
  await prisma.permission.createMany({ data: [...] });
  
  // 2. System Roles
  await prisma.role.createMany({ data: [...] });
  
  // 3. Subscription Plans
  await prisma.subscriptionPlan.createMany({ data: [...] });
  
  // 4. Demo Company
  const company = await prisma.company.create({ data: {...} });
  
  // 5. Default Roles for Company
  await prisma.role.createMany({ data: [...] });
  
  // 6. Demo User
  const user = await prisma.user.create({ data: {...} });
  
  // 7. CompanyUser + UserRole
  await prisma.companyUser.create({ data: {...} });
  await prisma.userRole.create({ data: {...} });
  
  // ... continue in order
}

main();
```

---

## Post-Migration Setup (Manual SQL)

After Prisma migrations, some PostgreSQL-specific optimizations require manual SQL:

### 1. Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all tenant tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tenant tables

-- Create policy function
CREATE OR REPLACE FUNCTION app.current_company() 
RETURNS uuid AS $$
  SELECT current_setting('app.current_company', true)::uuid;
$$ LANGUAGE SQL STABLE;

-- Create RLS policy (example for vehicles)
CREATE POLICY vehicles_company_isolation ON vehicles
  FOR ALL
  USING (company_id = app.current_company());
```

### 2. Partial Indexes for Soft Deletes

```sql
-- Create partial index for non-deleted records (more efficient than full index)
CREATE INDEX idx_vehicles_active ON vehicles(company_id, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_drivers_active ON drivers(company_id, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_trips_active ON trips(company_id, status) 
  WHERE deleted_at IS NULL;
```

### 3. TimescaleDB Extension (for GPS data)

```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert vehicle_locations to hypertable
SELECT create_hypertable('vehicle_locations', 'timestamp', 
  chunk_time_interval => INTERVAL '7 days');
```

### 4. Partitioning for Large Tables

```sql
-- Partition audit_logs by month (if not using TimescaleDB)
CREATE TABLE audit_logs_y2024m01 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- ... create partitions for each month
```

### 5. Full-Text Search Index (for vehicle/driver search)

```sql
-- Create GIN index for full-text search on vehicle registration
CREATE INDEX idx_vehicles_search ON vehicles 
  USING GIN (to_tsvector('simple', coalesce(registration_number, '') || ' ' || coalesce(make, '') || ' ' || coalesce(model, '')));

CREATE INDEX idx_drivers_search ON drivers 
  USING GIN (to_tsvector('simple', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(email, '')));
```

---

## Migration Checklist

Before running production migrations:

- [ ] Back up the existing database
- [ ] Run `prisma migrate status` to check pending migrations
- [ ] Run `prisma validate` to ensure schema is valid
- [ ] Run `prisma generate` to update the client
- [ ] Test migrations in a staging environment first
- [ ] Verify seed data runs correctly
- [ ] Run application smoke tests after migration
- [ ] Monitor migration logs for errors
- [ ] Verify indexes are created (check PostgreSQL)
- [ ] Verify RLS policies are applied (if enabled)
- [ ] Verify foreign key constraints are correct
- [ ] Run `ANALYZE` on all tables after migration for query planning

---

## Rollback Strategy

### Prisma Migration Rollback (Development)
```bash
# Mark a migration as rolled back (does not revert data)
npx prisma migrate resolve --rolled-back "20240101000000_init"

# Revert to a specific migration
npx prisma migrate deploy --to "20240101000000_init"
```

### Database Rollback (Production - Use with Caution)
```bash
# Restore from backup (recommended for production)
pg_restore -d fleet_db backup.dump

# Or use down migrations (if created)
npx prisma migrate down 1
```

### Important Notes
- Prisma does not generate `down` migrations automatically
- Always have a database backup before production migrations
- Test rollback procedures in staging before production
- Consider using a database migration tool (like Flyway or Liquibase) if complex rollback is needed

---

## Environment-Specific Considerations

### Development
- Use `prisma migrate dev` for interactive development
- Enable shadow database for conflict detection
- Use `prisma db seed` for development data

### Staging
- Use `prisma migrate deploy` for consistent deployment
- Mirror production data volume for realistic testing
- Run load tests after migrations

### Production
- Use `prisma migrate deploy` only (never `dev`)
- Schedule migrations during maintenance windows
- Use connection pooling (PgBouncer) to avoid connection limits during migrations
- Monitor PostgreSQL logs for migration errors
- Use `prisma migrate status` before deployment

---

## Migration File Naming Convention

```
YYYYmmddHHMMSS_descriptive_name

Examples:
20240716083000_init_schema
20240716100000_add_vehicle_photos
20240716120000_add_geofence_alerts
20240716150000_add_rls_policies
```

Prisma auto-generates timestamps. Descriptive names should be added after the auto-generated name for clarity.
