# Phase 15: Reports, Analytics & Business Intelligence

## Overview
Comprehensive analytics and reporting module providing data-driven insights, business intelligence, and automated reporting across all fleet operations.

## Backend Components

### 1. Database Schema Enhancements
- **Report System**: Reports, Scheduled Reports, Report Templates, Dashboard Widgets, Analytics Cache
- **5 Report Types**: TRIP, FLEET, DRIVER, FUEL, MAINTENANCE, CUSTOM
- **Report Formats**: JSON, CSV, PDF, XLSX, HTML
- **Scheduled Reports**: HOURLY, DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
- **6 Report Categories**: FLEET, DRIVER, FUEL, MAINTENANCE, COMPLIANCE, FINANCIAL, CUSTOM

### 2. KPI Calculator Engine
**File**: `src/modules/analytics/engine/kpi-calculator.ts`

Provides 6 KPI categories with date range filtering:

| Category | Metrics |
|----------|---------|
| Fleet | Total/active vehicles, utilization, availability, trips, downtime, avg trip distance |
| Driver | Total/active drivers, utilization, safety score, driving hours |
| Fuel | Consumption, total cost, cost/km, efficiency, fraud alerts |
| Maintenance | Total cost, due services, avg repair cost, downtime hours |
| Compliance | Compliance score, expiring docs, violations, incidents |
| Financial | Operating cost, maintenance, fuel, cost per vehicle/driver |

### 3. Report Service
**File**: `src/modules/analytics/services/report.service.ts`

- **generateReport()**: Creates reports with category-specific data aggregation
- **getReports()**: Lists reports with pagination (type, category, status filters)
- **getReportById()**: Fetches single report with full data
- **deleteReport()**: Soft delete

**Report Data Sources**:
- Trip reports: trips, aggregates (avg distance, cost)
- GPS reports: vehicle locations, speed averages
- Maintenance reports: work orders, schedules, costs
- Fuel reports: fuel logs, efficiency, fraud alerts
- Driver reports: driver behaviors, safety scores, violations
- Inventory reports: parts, stock movements
- Financial reports: expenses, invoices, payments
- Compliance reports: documents, inspections, violations
- Custom reports: User-defined queries

### 4. Analytics Cache Service
**File**: `src/modules/analytics/services/analytics-cache.service.ts`

- TTL-based caching with configurable expiration
- Category-based cache invalidation
- Automatic cleanup of expired entries

### 5. Controllers & API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/analytics/dashboard` | GET | All KPIs combined |
| `/api/analytics/fleet` | GET | Fleet KPIs |
| `/api/analytics/drivers` | GET | Driver KPIs |
| `/api/analytics/fuel` | GET | Fuel KPIs |
| `/api/analytics/maintenance` | GET | Maintenance KPIs |
| `/api/analytics/compliance` | GET | Compliance KPIs |
| `/api/analytics/financial` | GET | Financial KPIs |
| `/api/analytics/kpis` | GET | All KPIs (alias) |
| `/api/reports` | GET | List reports |
| `/api/reports` | POST | Generate report |
| `/api/reports/:id` | GET | Get report |
| `/api/reports/:id` | DELETE | Delete report |

All routes protected with `withAuth` middleware and `x-company-id` tenant isolation.

## Frontend Components

### 1. KPI Card (`src/components/analytics/KPICard.tsx`)
Reusable metric card with:
- Icon, title, value display
- Color theming (blue, green, amber, red, purple, orange)
- Trend indicator (up/down arrows)
- CountUp animation
- Subtitle support
- Loading skeleton state

### 2. Trend Indicator (`src/components/analytics/TrendIndicator.tsx`)
- Positive/negative trend display with percentage
- Color-coded (green for positive, red for negative)
- Arrow icon indicators

### 3. Date Range Filter (`src/components/analytics/DateRangeFilter.tsx`)
- Start/end date inputs with calendar popover
- Preset buttons (Today, Week, Month, Quarter, Year)
- Apply/Reset functionality

### 4. Analytics Layout (`src/app/analytics/layout.tsx`)
- Sidebar navigation with category links
- Active state highlighting using `usePathname`
- Icons: Dashboard, Fleet, Drivers, Fuel, Maintenance, Compliance, Financial, Reports

## Analytics Pages

| Page | URL | Features |
|------|-----|----------|
| Dashboard | `/analytics` | KPI overview cards, all metrics |
| Fleet | `/analytics/fleet` | Vehicle KPIs, utilization, availability |
| Drivers | `/analytics/drivers` | Driver metrics, safety, hours |
| Fuel | `/analytics/fuel` | Consumption, costs, efficiency |
| Maintenance | `/analytics/maintenance` | Costs, due services, downtime |
| Compliance | `/analytics/compliance` | Score, violations, incidents |
| Financial | `/analytics/financial` | Operating costs, per-vehicle/driver |
| Reports | `/analytics/reports` | Report listing, generation, history |

## Technology Stack
- **ECharts**: Data visualization library (installed)
- **react-countup**: Animated number counting
- **Lucide React**: Icons
- **Tailwind CSS**: Styling
- **Prisma ORM**: Data aggregation queries
- **Next.js App Router**: API routes and SSR

## Caching Strategy
- KPI data cached with configurable TTL (default 60 minutes)
- Cache invalidation per category
- Automatic cleanup of expired entries
- Reduces database load for frequently accessed metrics

## Security
- All endpoints require authentication (`withAuth`)
- Tenant isolation via `x-company-id` header
- Role-based access control ready (RBAC middleware)
- Soft delete pattern applied

## Currency
All financial KPIs displayed in **KES (Kenyan Shilling)** as per company configuration.

## Files Created/Modified

### New Files
- `src/modules/analytics/engine/kpi-calculator.ts`
- `src/modules/analytics/services/report.service.ts`
- `src/modules/analytics/services/analytics-cache.service.ts`
- `src/modules/analytics/controllers/analytics.controller.ts`
- `src/modules/analytics/controllers/report.controller.ts`
- `src/app/api/analytics/dashboard/route.ts`
- `src/app/api/analytics/fleet/route.ts`
- `src/app/api/analytics/drivers/route.ts`
- `src/app/api/analytics/fuel/route.ts`
- `src/app/api/analytics/maintenance/route.ts`
- `src/app/api/analytics/compliance/route.ts`
- `src/app/api/analytics/financial/route.ts`
- `src/app/api/analytics/kpis/route.ts`
- `src/app/api/reports/route.ts`
- `src/app/api/reports/[id]/route.ts`
- `src/components/analytics/KPICard.tsx`
- `src/components/analytics/TrendIndicator.tsx`
- `src/components/analytics/DateRangeFilter.tsx`
- `src/app/analytics/page.tsx`
- `src/app/analytics/layout.tsx`
- `src/app/analytics/reports/page.tsx`
- `src/app/analytics/fleet/page.tsx`
- `src/app/analytics/drivers/page.tsx`
- `src/app/analytics/fuel/page.tsx`
- `src/app/analytics/maintenance/page.tsx`
- `src/app/analytics/compliance/page.tsx`
- `src/app/analytics/financial/page.tsx`
- `src/modules/analytics/__tests__/analytics.test.ts`
- `docs/PHASE15-ANALYTICS.md`

### Modified Files
- `prisma/schema.prisma` (Report relations on Company model)
- `package.json` (echarts, react-countup added)

## Build Status
✅ **Build Successful** — `npx next build` passes with no TypeScript errors.

## Next Phase
Phase 16: System Settings & Administration (Roles, audit logs, company settings, system preferences, data management, integration settings, backup/restore, system health monitoring).
