# Phase 2: Database Optimization Recommendations

## Overview

This document provides comprehensive database optimization strategies for the Fleet Management SaaS at 100,000+ vehicles across thousands of companies. Optimizations are categorized by performance, security, and operational concerns.

---

## Table of Contents

1. [Indexing Strategy](#indexing-strategy)
2. [Query Optimization](#query-optimization)
3. [Partitioning Strategy](#partitioning-strategy)
4. [Connection Pooling](#connection-pooling)
5. [Caching Strategy](#caching-strategy)
6. [Data Archival](#data-archival)
7. [Security Optimization](#security-optimization)
8. [Monitoring & Alerting](#monitoring--alerting)
9. [Capacity Planning](#capacity-planning)
10. [Recommended Indexes Not in Schema](#recommended-indexes-not-in-schema)

---

## Indexing Strategy

### Primary Index Rules

Every table follows this indexing hierarchy:

1. **Primary Key**: UUID with `gen_random_uuid()` default (via Prisma `uuid()`)
2. **Tenant Filter**: `companyId` on every tenant table
3. **Foreign Keys**: All foreign key columns are indexed
4. **Query Patterns**: Composite indexes for common WHERE + ORDER BY combinations
5. **Soft Delete**: `deletedAt` with partial indexes (WHERE deleted_at IS NULL)

### Index Categories

#### Category A: Essential Indexes (Already in Schema)

| Table | Index | Purpose |
|-------|-------|---------|
| Company | `status` | Filter by company status |
| Company | `slug` | Subdomain lookup |
| User | `email` | Login lookup |
| Vehicle | `companyId, status` | Fleet dashboard filtering |
| Vehicle | `companyId, currentDriverId` | Find vehicles by driver |
| Driver | `companyId, status` | Driver list filtering |
| Trip | `companyId, status, startTime` | Trip dashboard with date range |
| Invoice | `companyId, status, dueDate` | Billing dashboard |
| Payment | `companyId, status, paidAt` | Payment reconciliation |
| VehicleLocation | `companyId, vehicleId, timestamp` | GPS history queries |
| MaintenanceRecord | `companyId, vehicleId, serviceDate` | Maintenance history |
| AuditLog | `companyId, entityType, entityId` | Audit trail lookups |

#### Category B: High-Performance Indexes (Recommended additions)

Add these indexes after profiling real query patterns:

```sql
-- Full-text search on vehicles (combine make, model, registration)
CREATE INDEX idx_vehicles_fts ON vehicles 
  USING GIN (to_tsvector('simple', 
    COALESCE(make, '') || ' ' || 
    COALESCE(model, '') || ' ' || 
    COALESCE(registration_number, '') || ' ' ||
    COALESCE(vin, '')));

-- Full-text search on drivers
CREATE INDEX idx_drivers_fts ON drivers 
  USING GIN (to_tsvector('simple', 
    COALESCE(first_name, '') || ' ' || 
    COALESCE(last_name, '') || ' ' || 
    COALESCE(email, '') || ' ' ||
    COALESCE(phone, '')));

-- Full-text search on customers
CREATE INDEX idx_customers_fts ON customers 
  USING GIN (to_tsvector('simple', 
    COALESCE(name, '') || ' ' || 
    COALESCE(email, '') || ' ' || 
    COALESCE(phone, '')));

-- Partial index for active vehicles only (most common query)
CREATE INDEX idx_vehicles_active_only ON vehicles(company_id, status) 
  WHERE deleted_at IS NULL;

-- Partial index for active drivers only
CREATE INDEX idx_drivers_active_only ON drivers(company_id, status) 
  WHERE deleted_at IS NULL;

-- Partial index for overdue invoices
CREATE INDEX idx_invoices_overdue ON invoices(company_id, due_date) 
  WHERE status = 'OVERDUE' AND deleted_at IS NULL;

-- Partial index for pending expenses
CREATE INDEX idx_expenses_pending ON expenses(company_id, expense_date) 
  WHERE status = 'PENDING' AND deleted_at IS NULL;

-- Partial index for unread notifications
CREATE INDEX idx_notifications_unread ON notifications(company_id, user_id, created_at) 
  WHERE is_read = false;

-- Partial index for upcoming maintenance
CREATE INDEX idx_maintenance_due ON maintenance_schedules(company_id, next_due_date) 
  WHERE is_active = true AND deleted_at IS NULL;

-- Partial index for expired documents
CREATE INDEX idx_documents_expiring ON vehicle_documents(company_id, expiry_date) 
  WHERE expiry_date IS NOT NULL AND deleted_at IS NULL;

-- Covering index for trip listing (includes all commonly queried fields)
CREATE INDEX idx_trips_listing ON trips(company_id, status, start_time) 
  INCLUDE (vehicle_id, driver_id, customer_id, trip_number, distance, total_cost);

-- Covering index for fuel log reports
CREATE INDEX idx_fuel_logs_reporting ON fuel_logs(company_id, vehicle_id, fuel_date) 
  INCLUDE (quantity, unit_price, total_cost);
```

#### Category C: BRIN Indexes (For Large Time-Series Tables)

For very large time-series tables (VehicleLocation, AuditLog, ActivityLog), BRIN indexes are much smaller and faster than B-tree:

```sql
-- BRIN index for GPS data (excellent for append-only time-series data)
CREATE INDEX idx_vehicle_locations_brin ON vehicle_locations 
  USING BRIN (timestamp) WITH (pages_per_range = 128);

-- BRIN index for audit logs
CREATE INDEX idx_audit_logs_brin ON audit_logs 
  USING BRIN (created_at) WITH (pages_per_range = 128);
```

**Why BRIN**: Block Range INdexes are tiny (~1MB per 100GB table) and perfect for data that is naturally ordered by time (like GPS logs). They work best when data is inserted in chronological order.

---

## Query Optimization

### 1. Multi-Tenant Query Pattern

**Always** start queries with the company filter. This enables the query planner to use the most selective index first.

```typescript
// ✅ GOOD: Company filter first
prisma.vehicle.findMany({
  where: {
    companyId: 'uuid-here',      // Most selective - first!
    status: 'ACTIVE',            // Second filter
    deletedAt: null,             // Soft delete check
  },
  orderBy: { createdAt: 'desc' },
  take: 50,
  skip: 0,
});

// ❌ BAD: Company filter not first
prisma.vehicle.findMany({
  where: {
    status: 'ACTIVE',            // Less selective without company
    companyId: 'uuid-here',
  },
});
```

### 2. Pagination Strategy

Use cursor-based pagination for high-volume tables (VehicleLocation, Trip, FuelLog):

```typescript
// Cursor-based pagination (efficient for large datasets)
prisma.vehicleLocation.findMany({
  where: { companyId: 'uuid', vehicleId: 'uuid' },
  cursor: { id: lastSeenId },  // Start after this record
  take: 100,
  orderBy: { timestamp: 'desc' },
});

// Offset pagination (acceptable for small-medium tables)
prisma.vehicle.findMany({
  where: { companyId: 'uuid', deletedAt: null },
  take: 50,
  skip: (page - 1) * 50,
  orderBy: { createdAt: 'desc' },
});
```

**Rule**: Offset pagination is fine for < 10,000 records. Use cursor-based for GPS data, audit logs, and activity logs.

### 3. Select Only What You Need

```typescript
// ✅ GOOD: Select specific fields
prisma.vehicle.findMany({
  where: { companyId: 'uuid' },
  select: {
    id: true,
    registrationNumber: true,
    make: true,
    model: true,
    status: true,
  },
});

// ❌ BAD: Selecting everything (includes photos[], notes, etc.)
prisma.vehicle.findMany({
  where: { companyId: 'uuid' },
});
```

### 4. Avoid N+1 Queries

```typescript
// ❌ BAD: N+1 queries
const trips = await prisma.trip.findMany({ where: { companyId: 'uuid' } });
for (const trip of trips) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });
  const driver = await prisma.driver.findUnique({ where: { id: trip.driverId } });
}

// ✅ GOOD: Single query with includes
const trips = await prisma.trip.findMany({
  where: { companyId: 'uuid' },
  include: {
    vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
    driver: { select: { id: true, firstName: true, lastName: true } },
    customer: { select: { id: true, name: true } },
  },
  take: 50,
});
```

### 5. Batch Operations

```typescript
// ✅ GOOD: Batch inserts
await prisma.vehicleLocation.createMany({
  data: gpsBatch, // Array of 100-1000 records
  skipDuplicates: true,
});

// ✅ GOOD: Batch updates
await prisma.$transaction(
  vehiclesToUpdate.map(v =>
    prisma.vehicle.update({
      where: { id: v.id },
      data: { currentOdometer: v.odometer },
    })
  )
);
```

### 6. Aggregation Queries

For dashboards and reports, use Prisma's aggregate or raw SQL:

```typescript
// Vehicle count by status
const statusCounts = await prisma.vehicle.groupBy({
  by: ['status'],
  where: { companyId: 'uuid', deletedAt: null },
  _count: { id: true },
});

// Monthly fuel cost
const monthlyFuel = await prisma.$queryRaw`
  SELECT DATE_TRUNC('month', fuel_date) as month, SUM(total_cost) as total
  FROM fuel_logs
  WHERE company_id = ${companyId}::uuid
  AND fuel_date >= ${startDate} AND fuel_date <= ${endDate}
  GROUP BY DATE_TRUNC('month', fuel_date)
  ORDER BY month;
`;
```

---

## Partitioning Strategy

### Tables Requiring Partitioning

| Table | Partition Strategy | When to Implement |
|-------|-------------------|-------------------|
| VehicleLocation | By `timestamp` (monthly) | Immediately |
| AuditLog | By `createdAt` (monthly) | > 1M records |
| ActivityLog | By `createdAt` (monthly) | > 1M records |
| Notification | By `createdAt` (monthly) | > 500K records |
| OdometerReading | By `recordedAt` (monthly) | > 500K records |
| FuelLog | By `fuelDate` (quarterly) | > 500K records |

### Implementation: TimescaleDB for VehicleLocation

```sql
-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert to hypertable (automatic partitioning)
SELECT create_hypertable('vehicle_locations', 'timestamp', 
  chunk_time_interval => INTERVAL '7 days',
  if_not_exists => TRUE);

-- Add compression for old data (save ~90% space)
ALTER TABLE vehicle_locations SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'vehicle_id',
  timescaledb.compress_orderby = 'timestamp DESC'
);

-- Compress chunks older than 30 days
SELECT add_compression_policy('vehicle_locations', INTERVAL '30 days');

-- Add retention policy (delete after 2 years)
SELECT add_retention_policy('vehicle_locations', INTERVAL '2 years');
```

### Implementation: Native PostgreSQL Partitioning for AuditLog

```sql
-- Create partitioned table structure
CREATE TABLE audit_logs_partitioned (
  LIKE audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions (automate this in a cron job)
CREATE TABLE audit_logs_y2024m01 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE audit_logs_y2024m02 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... etc

-- Create indexes on each partition (inherited from parent)
CREATE INDEX idx_audit_logs_y2024m01_company 
  ON audit_logs_y2024m01 (company_id, created_at);
```

### Partition Maintenance Script

```sql
-- Run monthly to create new partitions
CREATE OR REPLACE FUNCTION create_monthly_partitions(
  table_name TEXT, 
  months_ahead INT DEFAULT 3
)
RETURNS VOID AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR i IN 0..months_ahead LOOP
    start_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month' * i);
    end_date := start_date + INTERVAL '1 month';
    partition_name := table_name || '_y' || 
      EXTRACT(YEAR FROM start_date) || 'm' || 
      LPAD(EXTRACT(MONTH FROM start_date)::TEXT, 2, '0');
    
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
      partition_name, table_name, start_date, end_date
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT create_monthly_partitions('audit_logs_partitioned', 6);
```

---

## Connection Pooling

### PgBouncer Configuration

```ini
; pgbouncer.ini
[databases]
fleet_db = host=localhost port=5432 dbname=fleet_db

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = hba
auth_file = /etc/pgbouncer/userlist.txt

; Pooling mode
pool_mode = transaction

; Pool sizes
max_client_conn = 10000
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3

; Timeouts
server_idle_timeout = 600
server_lifetime = 3600
server_connect_timeout = 15
query_timeout = 0
query_wait_timeout = 120
client_idle_timeout = 0
client_login_timeout = 60

; Logging
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
stats_period = 60
```

### Prisma Connection Pool

```env
; .env
DATABASE_URL="postgresql://user:pass@localhost:6432/fleet_db?schema=public&connection_limit=20&pool_timeout=10"
DIRECT_DATABASE_URL="postgresql://user:pass@localhost:5432/fleet_db"
```

```typescript
// Prisma client with connection pooling
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  connectionTimeout: 30000,
  queryTimeout: 10000,
});
```

### Connection Pool Rules

| Environment | PgBouncer Pool Size | Prisma Connection Limit | Max Concurrent Users |
|-------------|-------------------|------------------------|-------------------|
| Development | 10 | 5 | 1-5 |
| Staging | 25 | 10 | 10-50 |
| Production | 100+ | 20 | 100-500 |
| High Scale | 200+ | 50 | 500+ |

**Rule**: `Prisma connection_limit` × `Number of app instances` ≤ `PgBouncer pool_size` × `0.8`

---

## Caching Strategy

### Redis Cache Layers

```typescript
// Cache key patterns
const cacheKeys = {
  // Company context (TTL: 1 hour)
  company: (id: string) => `company:${id}`,
  
  // Fleet dashboard (TTL: 5 minutes)
  fleetStats: (companyId: string) => `fleet:stats:${companyId}`,
  
  // Vehicle list (TTL: 2 minutes)
  vehicles: (companyId: string, page: number) => `vehicles:${companyId}:p${page}`,
  
  // Driver list (TTL: 2 minutes)
  drivers: (companyId: string, page: number) => `drivers:${companyId}:p${page}`,
  
  // Trip details (TTL: 1 minute)
  trip: (id: string) => `trip:${id}`,
  
  // Vehicle location (TTL: 30 seconds)
  vehicleLocation: (vehicleId: string) => `loc:${vehicleId}`,
  
  // Active geofences (TTL: 5 minutes)
  geofences: (companyId: string) => `geofences:${companyId}`,
  
  // User roles (TTL: 15 minutes)
  userRoles: (userId: string, companyId: string) => `roles:${userId}:${companyId}`,
  
  // Permissions (TTL: 30 minutes)
  permissions: (roleId: string) => `perms:${roleId}`,
  
  // Subscription (TTL: 10 minutes)
  subscription: (companyId: string) => `sub:${companyId}`,
  
  // API Rate limit (TTL: 1 minute)
  rateLimit: (apiKey: string) => `ratelimit:${apiKey}`,
};
```

### Cache TTL Strategy

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Company settings | 1 hour | Rarely changes |
| Vehicle list | 2 minutes | Moderately dynamic |
| Driver list | 2 minutes | Moderately dynamic |
| Trip details | 1 minute | Frequently updated |
| GPS location | 30 seconds | Real-time data |
| Geofences | 5 minutes | Config changes only |
| User roles | 15 minutes | Permission changes are rare |
| Fleet stats | 5 minutes | Dashboard aggregation |
| Invoice summary | 5 minutes | Financial data |
| Audit log | No cache | Compliance - never cache |

### Cache Invalidation

```typescript
// Invalidate cache on data mutations
async function invalidateVehicleCache(companyId: string, vehicleId?: string) {
  const pipeline = redis.pipeline();
  
  // Invalidate fleet stats
  pipeline.del(`fleet:stats:${companyId}`);
  
  // Invalidate vehicle lists
  const keys = await redis.keys(`vehicles:${companyId}:*`);
  keys.forEach(key => pipeline.del(key));
  
  // Invalidate specific vehicle
  if (vehicleId) {
    pipeline.del(`vehicle:${vehicleId}`);
  }
  
  await pipeline.exec();
}
```

---

## Data Archival

### Archival Strategy by Table

| Table | Retention Period | Archive Destination | Compression |
|-------|-----------------|-------------------|-------------|
| VehicleLocation | 2 years | S3 / Glacier | TimescaleDB compression |
| AuditLog | 7 years | S3 / Cold storage | Gzip |
| ActivityLog | 1 year | S3 / Cold storage | Gzip |
| Notification | 90 days | Hard delete | N/A |
| Session | 30 days | Hard delete | N/A |
| RefreshToken | 7 days (revoked) | Hard delete | N/A |
| GeofenceAlert | 1 year | S3 / Cold storage | Gzip |
| Expense (receipts) | 7 years | S3 / Glacier | N/A |
| Invoice (PDFs) | 7 years | S3 / Glacier | N/A |
| VehicleDocument | 7 years | S3 / Standard | N/A |
| DriverDocument | 7 years | S3 / Standard | N/A |

### Archival Implementation

```sql
-- Archive old vehicle locations to S3 (via PostgreSQL FDW or application script)
-- 1. Export to Parquet
-- 2. Upload to S3
-- 3. Delete from database

-- Example: Archive vehicle locations older than 2 years
-- Run as a cron job (weekly)

-- Step 1: Create export table
CREATE TABLE IF NOT EXISTS vehicle_locations_archive AS 
SELECT * FROM vehicle_locations WHERE 1=0;

-- Step 2: Move old data to archive (weekly cron)
WITH archived AS (
  DELETE FROM vehicle_locations
  WHERE timestamp < NOW() - INTERVAL '2 years'
  RETURNING *
)
INSERT INTO vehicle_locations_archive
SELECT * FROM archived;

-- Step 3: Export archive table to S3 (using pg_dump or custom script)
-- Then truncate archive table
TRUNCATE vehicle_locations_archive;
```

---

## Security Optimization

### 1. Row-Level Security (RLS)

```sql
-- Enable RLS on all tenant tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tenant tables

-- Create application context function
CREATE OR REPLACE FUNCTION app.current_company() 
RETURNS uuid AS $$
BEGIN
  RETURN current_setting('app.current_company', true)::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create RLS policy for vehicles
CREATE POLICY vehicles_company_isolation ON vehicles
  FOR ALL
  TO application_user
  USING (company_id = app.current_company());

-- Apply to all tenant tables
-- Note: Super admin bypass via separate role or app-level logic
```

### 2. Column-Level Encryption

```sql
-- Encrypt sensitive driver data (ID numbers, license numbers)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted columns (managed by application)
-- Application encrypts before insert, decrypts after select
-- Using AES-256-GCM with company-specific keys
```

### 3. Audit Trigger

```sql
-- Auto-audit all changes
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, old_value, new_value)
    VALUES (OLD.company_id, app.current_user_id(), 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD), NULL);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, old_value, new_value)
    VALUES (NEW.company_id, app.current_user_id(), 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, new_value)
    VALUES (NEW.company_id, app.current_user_id(), 'CREATE', TG_TABLE_NAME, NEW.id, row_to_json(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply to critical tables
CREATE TRIGGER vehicles_audit AFTER INSERT OR UPDATE OR DELETE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

### 4. Prepared Statements

Prisma uses prepared statements by default. Ensure they are enabled:

```env
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&statement_cache_size=100"
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

| Metric | Warning Threshold | Critical Threshold | Action |
|--------|-------------------|-------------------|--------|
| Query duration | > 500ms | > 2000ms | Add index, optimize query |
| Connection count | > 80% pool | > 95% pool | Increase pool size, add PgBouncer |
| Disk I/O | > 70% | > 90% | Add RAM, optimize queries, partition |
| Replication lag | > 5s | > 30s | Check network, reduce write load |
| Table bloat | > 30% | > 50% | Run VACUUM FULL |
| Dead tuples | > 10% | > 25% | Run VACUUM, ANALYZE |
| Index usage | < 95% | < 90% | Investigate unused indexes |
| Cache hit ratio | < 99% | < 95% | Increase shared_buffers |

### Useful Monitoring Queries

```sql
-- Find slow queries (run in pg_stat_statements)
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Find missing indexes (seq scans on large tables)
SELECT schemaname, tablename, seq_scan, seq_tup_read, idx_scan, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 20;

-- Index usage efficiency
SELECT schemaname, tablename, relname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;

-- Table bloat estimation
SELECT schemaname, tablename, 
  ROUND(CASE WHEN otta=0 OR sml.relpages=0 THEN 0.0 
    ELSE sml.relpages/otta::numeric END, 1) AS tbloat,
  CASE WHEN relpages < otta THEN 0 
    ELSE sml.relpages - otta END AS wastedpages
FROM (
  SELECT schemaname, tablename, cc.relpages, bs,
    CEIL((cc.tupsize*((cc.reltuples-cc.reltuples*cc.fillfactor)/(cc.fillfactor*100)))::numeric
      + (cc.pagehdr + cc.pageopqdata + (cc.tupheader-1)*cc.reltuples)) AS otta
  FROM (
    SELECT ma,bs,schemaname,tablename,
      (datahdr + (ctid - 1) * ma) / bs::float AS relpages,
      reltuples,
      fillfactor,
      pagehdr,
      pageopqdata,
      tupheader,
      tupsize
    FROM (
      SELECT current_setting('block_size')::int AS bs,
        schemaname, tablename, reltuples, relpages, fillfactor,
        24 AS pagehdr,
        8 AS pageopqdata,
        23 + 8 AS tupheader,
        CASE WHEN version()~'64-bit|x86_64|ppc64|ia64|amd64' THEN 8 ELSE 4 END AS ma
      FROM pg_tables
      JOIN pg_class ON pg_class.relname = pg_tables.tablename
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace AND pg_namespace.nspname = pg_tables.schemaname
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ) AS foo
  ) AS rs
  JOIN pg_class cc ON cc.relname = rs.tablename AND cc.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = rs.schemaname)
) AS sml
WHERE sml.relpages - otta > 128
ORDER BY tbloat DESC
LIMIT 20;
```

---

## Capacity Planning

### Storage Estimates (Per Company, Per Month)

| Data Type | Records/Month | Size/Record | Total/Month | Notes |
|-----------|--------------|-------------|-------------|-------|
| VehicleLocation | 50 per vehicle | 200 bytes | 1 GB per 1000 vehicles | Highest storage consumer |
| Trip | 100 per vehicle | 500 bytes | 50 MB per 1000 vehicles | |
| FuelLog | 50 per vehicle | 300 bytes | 15 MB per 1000 vehicles | |
| OdometerReading | 30 per vehicle | 150 bytes | 4.5 MB per 1000 vehicles | |
| AuditLog | 10,000 | 500 bytes | 5 MB | |
| ActivityLog | 50,000 | 300 bytes | 15 MB | |
| Notification | 100,000 | 400 bytes | 40 MB | |

### Total Storage at Scale

| Scale | Vehicles | Companies | Monthly Storage | Annual Storage |
|-------|----------|-----------|----------------|---------------|
| Startup | 100 | 10 | 100 GB | 1.2 TB |
| Growth | 1,000 | 100 | 1 TB | 12 TB |
| Scale | 10,000 | 1,000 | 10 TB | 120 TB |
| Enterprise | 100,000 | 10,000 | 100 TB | 1.2 PB |

### CPU / Memory Requirements

| Scale | PostgreSQL CPU | PostgreSQL RAM | Redis RAM | Application Servers |
|-------|---------------|----------------|-----------|---------------------|
| Startup | 2 cores | 4 GB | 2 GB | 1-2 |
| Growth | 4 cores | 16 GB | 4 GB | 2-4 |
| Scale | 16 cores | 64 GB | 16 GB | 4-8 |
| Enterprise | 32+ cores | 128+ GB | 32+ GB | 8-16 |

---

## Recommended Indexes Not in Schema

These indexes should be added based on actual query patterns after the application is running:

```sql
-- ============================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================

CREATE INDEX idx_vehicles_fts ON vehicles 
  USING GIN (to_tsvector('simple', 
    COALESCE(make, '') || ' ' || 
    COALESCE(model, '') || ' ' || 
    COALESCE(registration_number, '') || ' ' ||
    COALESCE(vin, '')));

CREATE INDEX idx_drivers_fts ON drivers 
  USING GIN (to_tsvector('simple', 
    COALESCE(first_name, '') || ' ' || 
    COALESCE(last_name, '') || ' ' || 
    COALESCE(email, '') || ' ' ||
    COALESCE(phone, '') || ' ' ||
    COALESCE(id_number, '')));

CREATE INDEX idx_customers_fts ON customers 
  USING GIN (to_tsvector('simple', 
    COALESCE(name, '') || ' ' || 
    COALESCE(email, '') || ' ' || 
    COALESCE(phone, '')));

-- ============================================
-- PARTIAL INDEXES (For Active Records Only)
-- ============================================

CREATE INDEX idx_vehicles_active ON vehicles(company_id, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_drivers_active ON drivers(company_id, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_trips_active ON trips(company_id, status, start_time) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_invoices_overdue ON invoices(company_id, due_date) 
  WHERE status = 'OVERDUE' AND deleted_at IS NULL;

CREATE INDEX idx_expenses_pending ON expenses(company_id, expense_date) 
  WHERE status = 'PENDING' AND deleted_at IS NULL;

CREATE INDEX idx_maintenance_schedules_due ON maintenance_schedules(company_id, next_due_date) 
  WHERE is_active = true AND deleted_at IS NULL AND next_due_date IS NOT NULL;

CREATE INDEX idx_documents_expiring ON vehicle_documents(company_id, expiry_date) 
  WHERE expiry_date IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_driver_documents_expiring ON driver_documents(company_id, expiry_date) 
  WHERE expiry_date IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_insurances_expiring ON insurances(company_id, end_date) 
  WHERE end_date IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_inspections_due ON inspections(company_id, next_inspection_date) 
  WHERE next_inspection_date IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_notifications_unread ON notifications(company_id, user_id, created_at) 
  WHERE is_read = false;

-- ============================================
-- COVERING INDEXES (Index-Only Scans)
-- ============================================

CREATE INDEX idx_trips_listing ON trips(company_id, status, start_time) 
  INCLUDE (vehicle_id, driver_id, customer_id, trip_number, distance, total_cost);

CREATE INDEX idx_fuel_logs_reporting ON fuel_logs(company_id, vehicle_id, fuel_date) 
  INCLUDE (quantity, unit_price, total_cost, fuel_type);

CREATE INDEX idx_vehicles_dashboard ON vehicles(company_id, status, created_at) 
  INCLUDE (registration_number, make, model, current_driver_id, current_odometer, photo);

CREATE INDEX idx_drivers_dashboard ON drivers(company_id, status, created_at) 
  INCLUDE (first_name, last_name, phone, email, current_vehicle_id, rating, photo);

-- ============================================
-- BRIN INDEXES (For Time-Series Data)
-- ============================================

CREATE INDEX idx_vehicle_locations_brin ON vehicle_locations 
  USING BRIN (timestamp) WITH (pages_per_range = 128);

CREATE INDEX idx_audit_logs_brin ON audit_logs 
  USING BRIN (created_at) WITH (pages_per_range = 128);

CREATE INDEX idx_activity_logs_brin ON activity_logs 
  USING BRIN (created_at) WITH (pages_per_range = 128);

-- ============================================
-- GIST INDEXES (For Geospatial Queries)
-- ============================================
-- If using PostGIS extension (recommended for geospatial queries):

CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry column to vehicle_locations
SELECT AddGeometryColumn('vehicle_locations', 'geom', 4326, 'POINT', 2);
UPDATE vehicle_locations SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);
CREATE INDEX idx_vehicle_locations_geom ON vehicle_locations USING GIST (geom);

-- Add geometry column to geofences
SELECT AddGeometryColumn('geofences', 'geom', 4326, 'POLYGON', 2);
-- Update based on geofence coordinates
CREATE INDEX idx_geofences_geom ON geofences USING GIST (geom);

-- ============================================
-- COMPOSITE INDEXES FOR COMMON FILTER COMBINATIONS
-- ============================================

CREATE INDEX idx_trips_date_range ON trips(company_id, start_time, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_fuel_logs_vehicle_date ON fuel_logs(company_id, vehicle_id, fuel_date, fuel_type) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_maintenance_records_vehicle_date ON maintenance_records(company_id, vehicle_id, service_date, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_payments_date_method ON payments(company_id, paid_at, method, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_expenses_category_date ON expenses(company_id, category, expense_date, status) 
  WHERE deleted_at IS NULL;

-- ============================================
-- UNIQUE INDEXES WITH SOFT DELETE
-- ============================================
-- For tables that need unique constraints but with soft delete support

-- Example: Allow duplicate registration numbers for deleted vehicles
-- Already handled by partial unique index in Prisma schema
-- If needed, add this partial unique index:
CREATE UNIQUE INDEX idx_vehicles_reg_unique_active ON vehicles(company_id, registration_number) 
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_drivers_email_unique_active ON drivers(company_id, email) 
  WHERE deleted_at IS NULL AND email IS NOT NULL;

CREATE UNIQUE INDEX idx_drivers_employee_id_unique_active ON drivers(company_id, employee_id) 
  WHERE deleted_at IS NULL AND employee_id IS NOT NULL;
```

---

## Summary Checklist

### Immediate (Before Launch)
- [ ] Enable `pgcrypto` extension (for UUID generation)
- [ ] Configure PgBouncer connection pooling
- [ ] Set up Redis for caching
- [ ] Add `pg_stat_statements` extension for query monitoring
- [ ] Configure `shared_buffers` to 25% of RAM
- [ ] Configure `effective_cache_size` to 75% of RAM
- [ ] Configure `work_mem` to 4MB per connection
- [ ] Configure `maintenance_work_mem` to 256MB
- [ ] Enable `autovacuum` with aggressive settings for high-write tables

### Short-Term (After Launch, < 3 Months)
- [ ] Monitor query performance with `pg_stat_statements`
- [ ] Add full-text search indexes (GIN) based on actual search patterns
- [ ] Add partial indexes for active records
- [ ] Set up TimescaleDB for VehicleLocation
- [ ] Implement Redis caching for dashboard queries
- [ ] Set up automated VACUUM and ANALYZE for high-write tables
- [ ] Configure read replicas for reporting queries

### Medium-Term (3-12 Months)
- [ ] Partition AuditLog and ActivityLog by month
- [ ] Implement data archival for VehicleLocation (> 2 years)
- [ ] Add BRIN indexes for large time-series tables
- [ ] Implement column-level encryption for sensitive data
- [ ] Set up Row-Level Security (RLS) policies
- [ ] Add PostGIS for geospatial queries (if needed)
- [ ] Implement automated partitioning maintenance

### Long-Term (> 12 Months)
- [ ] Evaluate database sharding for horizontal scaling
- [ ] Implement cross-region read replicas
- [ ] Set up automated data archival to S3
- [ ] Evaluate TimescaleDB for all time-series data
- [ ] Implement database federation for reporting (separate analytics DB)
- [ ] Continuous index tuning based on query patterns

---

## PostgreSQL Configuration Recommendations

### postgresql.conf

```ini
# Memory
shared_buffers = 4GB                    # 25% of total RAM
effective_cache_size = 12GB             # 75% of total RAM
work_mem = 16MB                         # Per-operation memory
maintenance_work_mem = 512MB            # For VACUUM, CREATE INDEX

# WAL / Write Ahead Log
wal_buffers = 16MB
max_wal_size = 4GB
min_wal_size = 1GB
checkpoint_completion_target = 0.9

# Connections
max_connections = 200                   # Adjust based on PgBouncer pool size

# Query Planning
random_page_cost = 1.1                  # For SSD storage
effective_io_concurrency = 200          # For SSD storage

# Logging
log_min_duration_statement = 500        # Log slow queries (> 500ms)
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Autovacuum (aggressive for high-write tables)
autovacuum = on
autovacuum_max_workers = 6
autovacuum_naptime = 30s
autovacuum_vacuum_threshold = 50
autovacuum_vacuum_scale_factor = 0.05   # Vacuum when 5% dead tuples
autovacuum_analyze_threshold = 50
autovacuum_analyze_scale_factor = 0.02  # Analyze when 2% changed

# Extensions
shared_preload_libraries = 'pg_stat_statements,timescaledb'
pg_stat_statements.max = 10000
pg_stat_statements.track = all
```

### For High-Write Tables (VehicleLocation, AuditLog)

```sql
-- More aggressive autovacuum for specific tables
ALTER TABLE vehicle_locations SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005,
  fillfactor = 90
);

ALTER TABLE audit_logs SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005
);
```

---

## Prisma Client Optimization

```typescript
// Optimized Prisma client configuration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  
  // Query timeout for slow queries
  queryTimeout: 10000, // 10 seconds
  
  // Connection settings
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Middleware for automatic company filtering (tenant isolation)
prisma.$use(async (params, next) => {
  // Add company filter to all relevant queries
  if (params.model && params.args?.where && !params.args.where.companyId) {
    const tenantModels = [
      'Vehicle', 'Driver', 'Trip', 'FuelLog', 'MaintenanceRecord',
      'Invoice', 'Payment', 'Customer', 'Expense', 'Notification',
      'AuditLog', 'ActivityLog', 'Geofence', 'Route'
    ];
    
    if (tenantModels.includes(params.model)) {
      // Get current company from context (set via middleware)
      const companyId = getCurrentCompanyId(); // From request context
      if (companyId) {
        params.args.where.companyId = companyId;
      }
    }
  }
  
  return next(params);
});

// Middleware for soft delete filtering
prisma.$use(async (params, next) => {
  const softDeleteModels = [
    'Vehicle', 'Driver', 'Company', 'Trip', 'FuelLog', 'MaintenanceRecord',
    'MaintenanceSchedule', 'ServiceCenter', 'Route', 'Geofence',
    'VehicleDocument', 'DriverDocument', 'Insurance', 'Inspection',
    'Customer', 'Invoice', 'Payment', 'Expense', 'APIKey', 'Webhook',
    'CompanySubscription', 'NotificationPreference', 'Role', 'VehicleType',
    'VehicleCategory', 'CompanyUser', 'SubscriptionPlan'
  ];
  
  if (softDeleteModels.includes(params.model) && params.action !== 'delete') {
    if (!params.args.where) params.args.where = {};
    if (params.args.where.deletedAt === undefined) {
      params.args.where.deletedAt = null;
    }
  }
  
  return next(params);
});

export default prisma;
```

---

## Final Notes

1. **Start simple**: The schema includes many indexes. In production, add indexes incrementally based on actual query patterns, not anticipated ones.
2. **Measure before optimizing**: Use `pg_stat_statements` and `EXPLAIN ANALYZE` to identify real bottlenecks.
3. **Index trade-offs**: Every index slows down writes. For high-write tables (VehicleLocation, AuditLog), prefer fewer, more selective indexes.
4. **Partition early**: For time-series data, partition before you hit 10M records. It's much harder to partition a table with 100M records.
5. **Test with realistic data**: Use `pgbench` or realistic load tests to validate performance before launch.
6. **Monitor continuously**: Set up alerts for slow queries, connection pool exhaustion, and disk growth.
