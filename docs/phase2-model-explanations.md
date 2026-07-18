# Phase 2: Database Design - Model Explanations

## Overview

This document provides detailed explanations for every model in the Fleet Management SaaS Prisma schema. The schema is designed for multi-tenant PostgreSQL with Prisma ORM, supporting thousands of companies and hundreds of thousands of vehicles.

---

## Table of Contents

1. [Platform & Tenant Models](#platform--tenant)
2. [Fleet Models](#fleet)
3. [Operations Models](#operations)
4. [Maintenance Models](#maintenance)
5. [Documents Models](#documents)
6. [Finance Models](#finance)
7. [Communication Models](#communication)
8. [Reports & Auditing Models](#reports--auditing)
9. [SaaS Models](#saas)

---

## Platform & Tenant

### Company

The central tenant isolation entity. Every piece of business data belongs to exactly one Company. Companies are identified by their unique `slug` (used for subdomain routing) and have their own branding, timezone, and settings.

| Field | Purpose |
|-------|---------|
| `slug` | Unique subdomain identifier (`company-slug.fleetapp.com`) |
| `timezone` | Default timezone for all timestamp operations |
| `currency` | Default currency for financial calculations |
| `settings` | JSON configuration (notifications, branding, modules) |
| `status` | Account lifecycle: PENDING → ACTIVE → SUSPENDED |
| `trialEndsAt` | Trial expiration for SaaS billing |

**Multi-tenancy**: Every query filters by `companyId`. The `Company` model serves as the root of the tenant tree.

**Soft delete**: Yes (`deletedAt`). When a company is deleted, cascade deletes all child data.

---

### User

Global user accounts that can belong to multiple companies. A user logs in once and can switch between companies they have access to. Users are NOT scoped to a company — the `CompanyUser` junction table handles the company membership.

| Field | Purpose |
|-------|---------|
| `email` | Unique identifier, used for login |
| `passwordHash` | Argon2id hashed password |
| `emailVerifiedAt` | Timestamp of email verification |
| `twoFactorEnabled` | Whether 2FA is active |
| `failedLoginAttempts` | Brute force protection counter |
| `lockedUntil` | Account lockout timestamp |

**Multi-tenancy**: Users are global. Access to a specific company is determined via `CompanyUser` and `UserRole`.

**Soft delete**: Yes (`deletedAt`). Deleting a user invalidates all sessions and refresh tokens via cascade.

---

### CompanyUser

Junction table linking Users to Companies. A user can belong to multiple companies with different roles in each. This is the core of multi-tenant user membership.

| Field | Purpose |
|-------|---------|
| `employeeId` | Company's internal employee ID |
| `department` | Organizational department |
| `jobTitle` | Position within the company |
| `hireDate` | When the employee joined |
| `isOwner` | Whether this user is the company owner |
| `isActive` | Whether the membership is active |

**Multi-tenancy**: Has both `userId` and `companyId`. Queries always filter by `companyId`.

**Soft delete**: Yes (`deletedAt`). Inactivating a user in a company does NOT delete the global user account.

---

### Role

Permission collections that can be assigned to users. Roles can be system-wide (null `companyId`) or company-specific. The Company Owner can create custom roles with granular permissions.

| Field | Purpose |
|-------|---------|
| `name` | Role name (e.g., "Fleet Manager", "Driver") |
| `isSystem` | Whether this is a built-in role (cannot be deleted) |
| `isDefault` | Whether this role is auto-assigned to new users |
| `companyId` | Null for system roles; set for company-specific roles |
| `permissions` | Array of permission codes (e.g., `["vehicle:create", "trip:read"]`) |

**Multi-tenancy**: System roles have no `companyId`; custom roles belong to one company.

**Soft delete**: Yes (`deletedAt`). System roles cannot be deleted.

---

### Permission

Lookup table of all available permissions in the system. This serves as documentation and validation reference. The actual permission assignment happens via `Role.permissions` string array.

| Field | Purpose |
|-------|---------|
| `code` | Unique permission code (e.g., `vehicle:read`) |
| `module` | Functional module (e.g., `fleet`, `operations`, `billing`) |
| `category` | Optional subcategory |

**Multi-tenancy**: Global. Permissions are defined at the platform level.

**Soft delete**: No. Permissions are immutable once defined.

---

### UserRole

Junction table assigning a Role to a User within a Company context. A user can have multiple roles in one company, and different roles in different companies.

| Field | Purpose |
|-------|---------|
| `assignedBy` | Who granted this role |
| `assignedAt` | When the role was granted |

**Multi-tenancy**: Has `companyId`. Enables "same user, different roles per company".

**Soft delete**: No. Role assignments are removed, not soft-deleted (use `CompanyUser.isActive` instead).

---

### Session

Active browser/device sessions for security tracking. Enables "log out all other devices" functionality and security audit trails.

| Field | Purpose |
|-------|---------|
| `token` | Unique session token (not JWT) |
| `ipAddress` | IP at time of login |
| `userAgent` | Browser/device identifier |
| `expiresAt` | Session expiration timestamp |
| `lastActiveAt` | Most recent activity timestamp |
| `companyId` | Which company context the session was active in |

**Multi-tenancy**: `companyId` tracks the active company context but sessions are primarily user-scoped.

**Soft delete**: No. Sessions expire naturally; explicit logout deletes the record.

---

### RefreshToken

JWT refresh token storage for authentication. Enables token rotation and revocation. The actual token sent to the client is a random string; we store its hash.

| Field | Purpose |
|-------|---------|
| `tokenHash` | SHA-256 hash of the refresh token (NOT the token itself) |
| `expiresAt` | When the token becomes invalid |
| `revokedAt` | When the token was explicitly revoked |
| `replacedBy` | Which new token replaced this one (rotation chain) |
| `ipAddress` / `userAgent` | Security tracking |

**Multi-tenancy**: User-scoped, but `companyId` tracks the active context.

**Soft delete**: No. Revoked tokens are kept for audit (can be purged periodically).

---

## Fleet

### VehicleCategory

High-level vehicle classification (e.g., "Light Duty", "Heavy Duty", "Passenger"). Categories group vehicle types for organizational and reporting purposes.

| Field | Purpose |
|-------|---------|
| `name` | Category name (unique per company) |
| `icon` | UI icon identifier |
| `color` | UI color for the category |
| `sortOrder` | Display order |

**Multi-tenancy**: Scoped to `companyId`. Each company defines its own categories.

**Soft delete**: Yes (`deletedAt`).

---

### VehicleType

Specific vehicle configurations (e.g., "Toyota Hilux 2022", "Mercedes Actros 2545"). Types define technical specifications and are used for fleet standardization.

| Field | Purpose |
|-------|---------|
| `make` / `model` | Manufacturer and model |
| `capacity` | Passenger capacity |
| `loadCapacity` | Cargo capacity in kg |
| `fuelType` / `fuelEfficiency` | Fuel characteristics |
| `yearFrom` / `yearTo` | Model year range |

**Multi-tenancy**: Scoped to `companyId`. Each company defines its own types.

**Soft delete**: Yes (`deletedAt`).

---

### Vehicle

The core fleet entity. Every physical vehicle in the fleet has one record. Vehicles are the primary asset around which most operations revolve.

| Field | Purpose |
|-------|---------|
| `registrationNumber` | Primary license plate (unique per company) |
| `vin` | Vehicle Identification Number (unique per company) |
| `licensePlate` | Alternative plate identifier |
| `currentOdometer` | Latest known odometer reading (km) |
| `status` | Operational status (ACTIVE, MAINTENANCE, etc.) |
| `gpsDeviceId` | Link to active GPS device |
| `currentDriverId` | Link to currently assigned driver |
| `dimensions` | JSON { length, width, height } |
| `photos` | Array of photo URLs |

**Multi-tenancy**: Scoped to `companyId`. `registrationNumber` + `companyId` is unique.

**Soft delete**: Yes (`deletedAt`). Vehicles are soft-deleted to preserve historical trip and maintenance data.

**Key relations**:
- `currentDriver` → optional 1:1 with Driver
- `gpsDevice` → optional 1:1 with GPSDevice
- `type` / `category` → optional N:1 with VehicleType / VehicleCategory

---

### Driver

Fleet drivers who operate vehicles. Drivers can be linked to a User account (for login access) or exist as standalone records (for simple tracking).

| Field | Purpose |
|-------|---------|
| `userId` | Optional link to a User account (for driver app login) |
| `employeeId` | Company's internal employee ID |
| `idNumber` | National ID / Passport (unique per company) |
| `status` | Driver status (ACTIVE, SUSPENDED, TERMINATED, etc.) |
| `rating` | Average performance rating (0-5) |
| `totalTrips` / `totalDistance` | Lifetime statistics |
| `gender` / `maritalStatus` | Demographic info |

**Multi-tenancy**: Scoped to `companyId`. `email` + `companyId` and `employeeId` + `companyId` are unique.

**Soft delete**: Yes (`deletedAt`). Drivers are soft-deleted to preserve historical trip data.

**Key relations**:
- `user` → optional N:1 with User (for driver app access)
- `licenses` → 1:N with DriverLicense
- `assignments` → 1:N with VehicleAssignment

---

### DriverLicense

Driver license records with expiry tracking. A driver can have multiple licenses (different classes or types).

| Field | Purpose |
|-------|---------|
| `licenseType` | COMMERCIAL, NON_COMMERCIAL, LEARNER, etc. |
| `licenseClass` | A, B, C, D, E, F, M |
| `licenseNumber` | License number |
| `expiryDate` | Expiration date (for alerting) |
| `isVerified` | Whether the license has been verified |

**Multi-tenancy**: Inherited via Driver.

**Soft delete**: Yes (`deletedAt`).

---

### VehicleAssignment

Historical record of vehicle-to-driver assignments. Tracks when a driver was assigned/unassigned from a vehicle, enabling assignment history and analytics.

| Field | Purpose |
|-------|---------|
| `assignmentType` | PRIMARY, TEMPORARY, SUBSTITUTE, TRAINING |
| `assignedAt` / `unassignedAt` | Assignment period |
| `assignedBy` / `unassignedBy` | Who made the assignment |
| `isPrimary` | Whether this is the primary assignment |

**Multi-tenancy**: Has `companyId` but primarily accessed via Vehicle or Driver.

**Soft delete**: No. Historical records are immutable once unassigned.

---

## Operations

### GPSDevice

Hardware GPS tracking device registry. Each device has a unique IMEI and device ID for communication with the GPS provider API.

| Field | Purpose |
|-------|---------|
| `deviceId` | External provider's device ID (unique) |
| `imei` | Hardware IMEI (unique) |
| `simNumber` | SIM card number for data connectivity |
| `lastSeenAt` / `lastLocationAt` | Device connectivity status |
| `status` | ACTIVE, OFFLINE, SUSPENDED, etc. |
| `batteryLevel` / `signalStrength` | Device health metrics |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`). Decommissioned devices are soft-deleted.

---

### VehicleLocation

Real-time and historical GPS position data. This is the highest-write table in the system. Records are immutable (no updates, no soft delete).

| Field | Purpose |
|-------|---------|
| `latitude` / `longitude` | Position coordinates |
| `altitude` / `speed` / `heading` | Movement data |
| `accuracy` | GPS accuracy in meters |
| `ignition` | Whether ignition is on |
| `address` | Reverse-geocoded address |
| `timestamp` | GPS fix timestamp (from device) |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: No. Historical GPS data is immutable.

**Performance**: This table should be partitioned by `timestamp` (monthly) and use TimescaleDB for >1M records/day.

---

### Route

Predefined routes for trip planning. Routes consist of ordered stops and optional waypoints for turn-by-turn navigation.

| Field | Purpose |
|-------|---------|
| `startLocation` / `endLocation` | Human-readable endpoints |
| `startLat` / `startLng` / `endLat` / `endLng` | Coordinates |
| `distance` / `estimatedDuration` | Route metrics |
| `isOptimized` | Whether the route has been optimized for efficiency |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`).

---

### RouteStop

Ordered stops along a route (pickup, delivery, rest stops, etc.). Each stop has a fixed position and order in the route.

| Field | Purpose |
|-------|---------|
| `stopOrder` | Sequence in the route |
| `stopType` | PICKUP, DELIVERY, WAYPOINT, REST_STOP, FUEL_STOP |
| `estimatedWaitTime` | Expected dwell time |

**Multi-tenancy**: Inherited via Route.

**Soft delete**: Yes (`deletedAt`).

---

### Waypoint

Intermediate coordinates between route stops for precise turn-by-turn routing. Used to force the route to follow specific roads or avoid areas.

| Field | Purpose |
|-------|---------|
| `order` | Sequence in the waypoint list |
| `latitude` / `longitude` | Coordinate |

**Multi-tenancy**: Inherited via Route.

**Soft delete**: No. Waypoints are recreated on route update.

---

### Trip

A single vehicle journey from start to end. Trips are the core operational entity, linking vehicles, drivers, routes, and customers.

| Field | Purpose |
|-------|---------|
| `tripNumber` | Company-unique trip identifier (optional) |
| `status` | PLANNED → ASSIGNED → IN_PROGRESS → COMPLETED |
| `startTime` / `actualStartTime` | Planned vs actual start |
| `estimatedEndTime` / `actualEndTime` | Planned vs actual end |
| `startOdometer` / `endOdometer` | Distance validation |
| `distance` / `estimatedDistance` | Actual vs planned distance |
| `fuelCost` / `totalCost` | Cost tracking |
| `priority` | LOW, NORMAL, HIGH, URGENT |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`). Trips are soft-deleted to preserve financial and operational history.

**Key relations**:
- `vehicle` / `driver` → N:1 with Vehicle / Driver
- `route` → optional N:1 with Route
- `customer` → optional N:1 with Customer
- `tripStops` → 1:N with TripStop

---

### TripStop

Individual stops within a trip. Each TripStop corresponds to a RouteStop but can have deviations (actual vs planned times).

| Field | Purpose |
|-------|---------|
| `scheduledArrival` / `actualArrival` / `actualDeparture` | Time tracking |
| `waitDuration` | How long the vehicle stayed |
| `status` | PENDING, ARRIVED, DEPARTED, SKIPPED, DELAYED |
| `stopOrder` | Sequence in the trip |

**Multi-tenancy**: Inherited via Trip.

**Soft delete**: No. Trip stops are part of the trip record.

---

### Geofence

Virtual boundaries on the map. When a vehicle enters or exits a geofence, alerts are generated. Supports circle, polygon, and polyline shapes.

| Field | Purpose |
|-------|---------|
| `type` | CIRCLE, POLYGON, POLYLINE |
| `coordinates` | JSON array of coordinates |
| `radius` | For circle geofences (meters) |
| `alertType` | ENTER, EXIT, BOTH, DWELL, SPEED |
| `speedLimit` | For speed-based alerts |
| `vehicles` | Array of vehicle IDs to monitor (empty = all vehicles) |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`).

---

### GeofenceAlert

Individual alert events triggered when a vehicle interacts with a geofence. Immutable records for audit and reporting.

| Field | Purpose |
|-------|---------|
| `alertType` | What triggered the alert (ENTER, EXIT, etc.) |
| `latitude` / `longitude` / `speed` | Position at time of alert |
| `isAcknowledged` / `acknowledgedAt` / `acknowledgedBy` | Alert management |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: No. Alert records are immutable.

---

### FuelLog

Fuel purchase and consumption records. Tracks fuel costs per vehicle, driver, and trip for expense management and fuel efficiency analysis.

| Field | Purpose |
|-------|---------|
| `quantity` / `unitPrice` / `totalCost` | Purchase details |
| `fuelType` | DIESEL, PETROL, ELECTRIC, etc. |
| `odometerReading` | Odometer at time of fueling |
| `stationName` / `location` | Where fuel was purchased |
| `isBillable` / `isReimbursable` | Expense flags |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`).

---

### OdometerReading

Odometer snapshot records for tracking vehicle mileage over time. Used for maintenance scheduling, fuel efficiency, and trip validation.

| Field | Purpose |
|-------|---------|
| `reading` | Odometer value |
| `readingType` | MANUAL, GPS, DEVICE, IMPORTED, ESTIMATED |
| `source` | Device/app that recorded the reading |
| `recordedAt` | When the reading was taken |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: No. Odometer readings are immutable for audit purposes.

---

## Maintenance

### ServiceCenter

External maintenance providers (garages, dealerships, workshops). Used for maintenance scheduling and cost tracking.

| Field | Purpose |
|-------|---------|
| `name` / `contactName` / `email` / `phone` | Contact details |
| `address` / `city` / `state` / `country` | Location |
| `rating` | Quality rating |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`).

---

### MaintenanceSchedule

Recurring maintenance schedules for vehicles. Defines when maintenance is due based on time, mileage, or both.

| Field | Purpose |
|-------|---------|
| `scheduleType` | TIME_BASED, MILEAGE_BASED, BOTH, CONDITION_BASED |
| `intervalMonths` / `intervalMileage` / `intervalHours` | Trigger intervals |
| `lastServiceDate` / `lastServiceOdometer` | Last service reference |
| `nextDueDate` / `nextDueOdometer` | Calculated next service |
| `reminderDays` / `reminderOdometer` | Advance notice settings |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`).

---

### MaintenanceRecord

Individual maintenance service events. Links to a schedule (if recurring) and a service center. Tracks costs, parts, and labor.

| Field | Purpose |
|-------|---------|
| `serviceNumber` | Company-unique service identifier |
| `serviceDate` / `completionDate` | Service timeline |
| `odometerReading` | Vehicle mileage at service |
| `laborCost` / `partsCost` / `totalCost` / `taxAmount` | Cost breakdown |
| `workPerformed` / `recommendations` | Service details |
| `warrantyMonths` / `warrantyExpiry` / `isWarrantyValid` | Warranty tracking |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`). Maintenance records are preserved for audit.

**Key relations**:
- `schedule` → optional N:1 with MaintenanceSchedule
- `serviceCenter` → optional N:1 with ServiceCenter
- `spareParts` → 1:N with SparePart
- `maintenanceCosts` → 1:N with MaintenanceCost

---

### SparePart

Parts used in a maintenance service. Tracks part numbers, costs, and suppliers for inventory and warranty management.

| Field | Purpose |
|-------|---------|
| `partNumber` | Manufacturer part number |
| `quantity` / `unitPrice` / `totalPrice` | Cost details |
| `manufacturer` / `supplier` | Source tracking |
| `warrantyMonths` | Part warranty |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: No. Part records are part of the maintenance record.

---

### MaintenanceCost

Cost breakdown within a maintenance record. Separates labor, parts, fluids, tax, and other costs for detailed reporting.

| Field | Purpose |
|-------|---------|
| `costType` | LABOR, PARTS, FLUIDS, TAX, SHIPPING, OTHER |
| `amount` | Cost amount |
| `description` | Optional detail |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: No. Cost records are part of the maintenance record.

---

## Documents

### VehicleDocument

Documents attached to a vehicle (registration, insurance, inspection, etc.). Supports expiry tracking and verification workflow.

| Field | Purpose |
|-------|---------|
| `documentType` | REGISTRATION, INSURANCE, INSPECTION, etc. |
| `fileUrl` / `fileName` / `fileSize` / `mimeType` | File metadata |
| `expiryDate` / `issueDate` | Validity period |
| `isVerified` / `verifiedAt` / `verifiedBy` | Verification workflow |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`).

---

### DriverDocument

Documents attached to a driver (license, medical certificate, training certificate, etc.). Same structure as VehicleDocument but for drivers.

| Field | Purpose |
|-------|---------|
| `documentType` | LICENSE, MEDICAL, TRAINING, etc. |
| `expiryDate` | For expiration alerts |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`).

---

### Insurance

Vehicle insurance policies with coverage tracking. Supports multiple policies per vehicle and expiry alerts.

| Field | Purpose |
|-------|---------|
| `provider` | Insurance company name |
| `policyNumber` | Unique policy identifier (unique per company) |
| `coverageType` | LIABILITY, COLLISION, COMPREHENSIVE, etc. |
| `startDate` / `endDate` | Policy period |
| `premium` / `coverageAmount` / `deductible` | Financial terms |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`).

---

### Inspection

Vehicle inspection records (safety, emissions, compliance). Tracks inspector details, scores, and next inspection dates.

| Field | Purpose |
|-------|---------|
| `inspectionType` | Safety, emissions, DOT, etc. |
| `inspectorName` / `inspectorLicense` | Inspector credentials |
| `result` | PASS, FAIL, CONDITIONAL, PENDING, WAIVED |
| `score` | Numeric score (if applicable) |
| `nextInspectionDate` | For scheduling alerts |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`).

---

## Finance

### Customer

Clients who book trips or receive services. Customers can be invoiced for trips and track their payment history.

| Field | Purpose |
|-------|---------|
| `taxId` | Tax/VAT identifier |
| `creditLimit` / `balance` | Credit management |
| `paymentTerms` | Days until payment is due |
| `isActive` | Whether the customer account is active |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`).

---

### Invoice

Customer invoices for trips, services, or subscriptions. Supports multiple payment records per invoice.

| Field | Purpose |
|-------|---------|
| `invoiceNumber` | Unique invoice number (company-wide) |
| `issueDate` / `dueDate` / `paidDate` | Invoice timeline |
| `subtotal` / `taxRate` / `taxAmount` / `discountAmount` / `total` | Price breakdown |
| `amountPaid` / `amountDue` | Payment tracking |
| `status` | DRAFT, SENT, VIEWED, PAID, OVERDUE, CANCELLED, PARTIAL |
| `pdfUrl` | Generated PDF location |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`). Invoices are preserved for financial audit.

---

### Payment

Payment records against invoices or standalone payments. Supports multiple payment methods (cards, M-Pesa, bank transfer, etc.).

| Field | Purpose |
|-------|---------|
| `amount` / `currency` | Payment amount |
| `method` | CREDIT_CARD, MPESA, BANK_TRANSFER, CASH, etc. |
| `status` | PENDING, PROCESSING, PAID, FAILED, etc. |
| `transactionId` | External payment gateway transaction ID |
| `gatewayResponse` | JSON response from payment gateway |
| `paidAt` | When payment was confirmed |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`). Payment records are preserved for reconciliation.

---

### Expense

Company expenses (fuel, maintenance, tolls, parking, etc.). Can be linked to trips, customers, or invoices. Supports approval workflow.

| Field | Purpose |
|-------|---------|
| `category` | FUEL, MAINTENANCE, TOLL, PARKING, etc. |
| `expenseDate` | When the expense occurred |
| `isReimbursable` / `isBillable` | Expense flags |
| `status` | PENDING, APPROVED, REJECTED, REIMBURSED, BILLED |
| `approvedBy` / `approvedAt` / `rejectedBy` / `rejectedAt` / `rejectionReason` | Approval workflow |
| `vendor` | Who was paid |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`).

---

## Communication

### Notification

In-app, email, SMS, and push notifications sent to users and drivers. Tracks delivery status and read state.

| Field | Purpose |
|-------|---------|
| `type` | TRIP, MAINTENANCE, FUEL, SYSTEM, ALERT, etc. |
| `title` / `message` | Notification content |
| `data` | JSON payload for deep links/actions |
| `isRead` / `readAt` | Read tracking |
| `channel` | IN_APP, EMAIL, SMS, PUSH, WEBHOOK |
| `sentAt` / `deliveredAt` / `failedAt` / `failureReason` | Delivery tracking |
| `actionUrl` | Deep link for the notification |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: No. Notifications are immutable after delivery.

---

### NotificationPreference

User-configurable notification settings per channel and type. Enables fine-grained control over which notifications a user receives and how.

| Field | Purpose |
|-------|---------|
| `type` / `channel` | Which notification type and channel |
| `isEnabled` | Whether this combination is active |
| `quietHoursStart` / `quietHoursEnd` | Do-not-disturb hours |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: No. Preferences are updated, not deleted.

---

## Reports & Auditing

### AuditLog

Immutable record of data changes for compliance and security. Tracks who changed what, when, and from where.

| Field | Purpose |
|-------|---------|
| `action` | CREATE, READ, UPDATE, DELETE, LOGIN, EXPORT, etc. |
| `entityType` / `entityId` | What was affected |
| `oldValue` / `newValue` | Before/after JSON snapshots |
| `ipAddress` / `userAgent` / `sessionId` | Request context |
| `metadata` | Additional context (e.g., query parameters) |

**Multi-tenancy**: Scoped to `companyId`. Platform admin can query across companies.

**Soft delete**: No. Audit logs are immutable and never deleted.

---

### ActivityLog

User activity tracking for analytics and user behavior insights. Lighter than AuditLog; tracks views, searches, exports, etc.

| Field | Purpose |
|-------|---------|
| `action` | Arbitrary action string (e.g., "viewed_dashboard", "exported_report") |
| `description` | Human-readable description |
| `metadata` | Additional JSON context |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: No. Activity logs can be archived after retention period.

---

## SaaS

### SubscriptionPlan

Predefined SaaS pricing tiers. Global (platform-level) definition of available plans.

| Field | Purpose |
|-------|---------|
| `name` / `slug` / `description` | Plan identification |
| `price` / `currency` / `billingInterval` | Pricing |
| `vehicleLimit` / `userLimit` / `tripLimit` | Resource limits |
| `featureFlags` | JSON feature toggles (e.g., `{ "apiAccess": true, "whiteLabel": false }`) |
| `isActive` / `isPublic` | Plan visibility |
| `isEnterprise` | Whether this is a custom enterprise plan |
| `trialDays` | Default trial duration |

**Multi-tenancy**: Global. No `companyId`.

**Soft delete**: Yes (`deletedAt`).

---

### CompanySubscription

Active subscription for a company. Links a Company to a SubscriptionPlan with billing details.

| Field | Purpose |
|-------|---------|
| `status` | TRIAL, ACTIVE, EXPIRED, CANCELLED, PAST_DUE, etc. |
| `startDate` / `endDate` / `trialEndsAt` | Subscription period |
| `vehicleLimit` / `userLimit` / `tripLimit` | Effective limits (can differ from plan) |
| `amount` / `currency` / `billingInterval` / `nextBillingDate` | Billing details |
| `autoRenew` | Whether subscription auto-renews |
| `cancellationReason` / `cancelledAt` / `cancelledBy` | Cancellation tracking |

**Multi-tenancy**: One record per company (`companyId` is unique).

**Soft delete**: Yes (`deletedAt`).

---

### APIKey

API keys for external integrations and third-party access. Enables programmatic access to the fleet API.

| Field | Purpose |
|-------|---------|
| `name` | Human-readable key name |
| `keyHash` | SHA-256 hash of the API key (NOT the key itself) |
| `keyPrefix` | First 8 characters for identification (safe to display) |
| `lastUsedAt` | Activity tracking |
| `permissions` | Array of allowed permission codes |
| `rateLimit` | Requests per minute/hour |
| `ipWhitelist` | Allowed IP addresses |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`). Revoked keys are soft-deleted for audit.

---

### Webhook

Outbound webhook configuration for real-time event notifications. When events occur, the system POSTs to the configured URL.

| Field | Purpose |
|-------|---------|
| `url` / `secret` / `events` | Endpoint configuration |
| `status` | ACTIVE, INACTIVE, FAILED, RETRYING, DISABLED |
| `lastTriggeredAt` / `lastFailedAt` / `failureCount` | Health monitoring |
| `retryCount` / `timeoutMs` / `headers` | Delivery configuration |

**Multi-tenancy**: Scoped to `companyId`.

**Soft delete**: Yes (`deletedAt`).

---

## Enum Reference

### UserStatus
- `ACTIVE` - Normal operation
- `INACTIVE` - Temporarily disabled
- `SUSPENDED` - Violation or non-payment
- `PENDING` - Awaiting email verification

### CompanyStatus
- `ACTIVE` - Normal operation
- `INACTIVE` - Voluntarily deactivated
- `SUSPENDED` - Violation or non-payment
- `PENDING` - Awaiting onboarding
- `TRIAL` - Trial period

### VehicleStatus
- `ACTIVE` - In service
- `INACTIVE` - Temporarily out of service
- `MAINTENANCE` - In workshop
- `RETIRED` - Permanently out of service
- `SOLD` - No longer owned
- `RESERVED` - Assigned but not yet active
- `ACCIDENT` - Involved in accident

### DriverStatus
- `ACTIVE` - Available for assignments
- `INACTIVE` - Temporarily unavailable
- `SUSPENDED` - Violation or disciplinary
- `TERMINATED` - No longer employed
- `ON_LEAVE` - Approved leave
- `PENDING` - Awaiting onboarding

### TripStatus
- `PLANNED` - Created but not scheduled
- `SCHEDULED` - Assigned a start time
- `ASSIGNED` - Vehicle and driver assigned
- `IN_PROGRESS` - Currently executing
- `COMPLETED` - Finished successfully
- `CANCELLED` - Cancelled before completion
- `DELAYED` - Behind schedule
- `NO_SHOW` - Driver/vehicle did not arrive

### MaintenanceStatus
- `SCHEDULED` - Planned but not started
- `IN_PROGRESS` - Currently being serviced
- `COMPLETED` - Finished successfully
- `OVERDUE` - Past due date
- `CANCELLED` - Cancelled
- `DEFERRED` - Postponed to later date

### FuelType
- `DIESEL` - Diesel fuel
- `PETROL` - Gasoline/petrol
- `ELECTRIC` - Electric vehicle
- `HYBRID` - Hybrid vehicle
- `CNG` - Compressed natural gas
- `LPG` - Liquefied petroleum gas
- `HYDROGEN` - Hydrogen fuel cell

### PaymentStatus
- `PENDING` - Awaiting payment
- `PROCESSING` - Payment in progress
- `PAID` - Successfully paid
- `OVERDUE` - Past due date
- `FAILED` - Payment failed
- `PARTIAL` - Partial payment received
- `REFUNDED` - Fully refunded
- `DISPUTED` - Under dispute

### InvoiceStatus
- `DRAFT` - Not yet sent
- `SENT` - Sent to customer
- `VIEWED` - Customer has opened
- `PAID` - Fully paid
- `OVERDUE` - Past due date
- `CANCELLED` - Voided
- `PARTIAL` - Partially paid

### DocumentType
- `REGISTRATION` - Vehicle registration
- `INSURANCE` - Insurance policy
- `INSPECTION` - Safety inspection certificate
- `LICENSE` - Driver license
- `CERTIFICATION` - Training/professional certificate
- `MEDICAL` - Medical certificate
- `TRAINING` - Training completion certificate
- `PERMIT` - Operating permit
- `PHOTO` - General photo
- `CONTRACT` - Employment/contract document
- `OTHER` - Uncategorized

### NotificationType
- `TRIP` - Trip-related notifications
- `MAINTENANCE` - Maintenance alerts
- `FUEL` - Fuel-related notifications
- `SYSTEM` - System announcements
- `BILLING` - Invoice/payment notifications
- `ALERT` - General alerts
- `GEOFENCE` - Geofence violations
- `SAFETY` - Safety incidents
- `ASSIGNMENT` - Vehicle/driver assignments
- `REMINDER` - General reminders

### NotificationChannel
- `IN_APP` - In-app notification bell
- `EMAIL` - Email delivery
- `SMS` - Text message
- `PUSH` - Mobile push notification
- `WEBHOOK` - Outbound webhook

### SubscriptionStatus
- `TRIAL` - Free trial period
- `TRIAL_EXPIRED` - Trial ended without conversion
- `ACTIVE` - Paid subscription active
- `PAST_DUE` - Payment failed but grace period active
- `EXPIRED` - Subscription ended
- `CANCELLED` - Voluntarily cancelled
- `SUSPENDED` - Non-payment suspension
- `INACTIVE` - Voluntarily deactivated

### WebhookStatus
- `ACTIVE` - Normal operation
- `INACTIVE` - Voluntarily disabled
- `FAILED` - Recent failures detected
- `RETRYING` - Currently retrying failed delivery
- `DISABLED` - Auto-disabled after max failures

### AuditAction
- `CREATE` / `READ` / `UPDATE` / `DELETE` - CRUD operations
- `LOGIN` / `LOGOUT` - Authentication events
- `EXPORT` / `IMPORT` - Data transfer
- `APPROVE` / `REJECT` - Approval workflows
- `SHARE` - Data sharing
- `ASSIGN` / `UNASSIGN` - Resource assignment
- `ACTIVATE` / `DEACTIVATE` - Status changes
- `ARCHIVE` / `RESTORE` - Archival operations
- `VERIFY` - Verification events

### ExpenseCategory
- `FUEL` - Fuel purchases
- `MAINTENANCE` - Vehicle repairs/service
- `TOLL` - Road tolls
- `PARKING` - Parking fees
- `INSURANCE` - Insurance premiums
- `LICENSE` - License/registration fees
- `CLEANING` - Vehicle cleaning
- `SUPPLIES` - Office/vehicle supplies
- `LODGING` - Accommodation
- `MEALS` - Food/meals
- `OTHER` - Uncategorized

### ExpenseStatus
- `PENDING` - Awaiting approval
- `APPROVED` - Approved for payment
- `REJECTED` - Rejected
- `REIMBURSED` - Reimbursement processed
- `BILLED` - Billed to customer

### GeofenceType
- `CIRCLE` - Circular boundary with radius
- `POLYGON` - Polygonal boundary
- `POLYLINE` - Linear corridor with width

### GeofenceAlertType
- `ENTER` - Alert on entry
- `EXIT` - Alert on exit
- `BOTH` - Alert on both entry and exit
- `DWELL` - Alert on prolonged stay
- `SPEED` - Alert on speed limit violation

### AssignmentType
- `PRIMARY` - Main/default assignment
- `TEMPORARY` - Short-term assignment
- `SUBSTITUTE` - Covering for another driver
- `TRAINING` - Training/observation period

### LicenseClass
- `A` - Motorcycles
- `B` - Light vehicles
- `C` - Medium vehicles
- `D` - Heavy vehicles
- `E` - Articulated vehicles
- `F` - Agricultural/industrial
- `M` - Military
- `OTHER` - Other classifications

### LicenseType
- `COMMERCIAL` - Commercial license
- `NON_COMMERCIAL` - Personal license
- `LEARNER` - Learner/provisional
- `PROVISIONAL` - Temporary/provisional
- `INTERNATIONAL` - International driving permit

### CoverageType
- `LIABILITY` - Third-party liability
- `COLLISION` - Collision/accident coverage
- `COMPREHENSIVE` - Full coverage
- `UNINSURED` - Uninsured motorist coverage
- `MEDICAL` - Medical payments
- `CARGO` - Cargo/goods coverage
- `GENERAL` - General liability
- `OTHER` - Other coverage types

### InspectionResult
- `PASS` - Passed inspection
- `FAIL` - Failed inspection
- `CONDITIONAL` - Passed with conditions
- `PENDING` - Awaiting result
- `WAIVED` - Requirement waived

### PaymentMethod
- `CREDIT_CARD` - Credit card
- `DEBIT_CARD` - Debit card
- `BANK_TRANSFER` - Bank/wire transfer
- `CASH` - Cash payment
- `CHECK` - Check/cheque
- `MPESA` - M-Pesa mobile money
- `MOBILE_MONEY` - Other mobile money
- `PAYPAL` - PayPal
- `STRIPE` - Stripe card processing
- `OTHER` - Other methods

### BillingInterval
- `MONTHLY` - Monthly billing
- `QUARTERLY` - Quarterly billing
- `YEARLY` - Annual billing

### CostType
- `LABOR` - Mechanic labor
- `PARTS` - Replacement parts
- `FLUIDS` - Oil, coolant, etc.
- `TAX` - Sales tax/VAT
- `SHIPPING` - Parts shipping
- `OTHER` - Other costs

### Gender
- `MALE` / `FEMALE` / `NON_BINARY` / `PREFER_NOT_TO_SAY` / `OTHER`

### MaritalStatus
- `SINGLE` / `MARRIED` / `DIVORCED` / `WIDOWED` / `SEPARATED` / `OTHER`

### OdometerReadingType
- `MANUAL` - Human-entered reading
- `GPS` - GPS-derived reading
- `DEVICE` - OBD/telemetry device reading
- `IMPORTED` - Bulk import
- `ESTIMATED` - Calculated estimate

### TripStopStatus
- `PENDING` - Not yet reached
- `ARRIVED` - Vehicle arrived
- `DEPARTED` - Vehicle left
- `SKIPPED` - Stop was skipped
- `DELAYED` - Arrived behind schedule
- `CANCELLED` - Stop cancelled

### RouteStopType
- `PICKUP` - Cargo pickup
- `DELIVERY` - Cargo delivery
- `WAYPOINT` - Navigation waypoint
- `REST_STOP` - Driver rest stop
- `FUEL_STOP` - Refueling
- `MAINTENANCE` - Maintenance stop
- `OTHER` - Other stop types

### GPSDeviceStatus
- `ACTIVE` - Connected and reporting
- `INACTIVE` - Temporarily disabled
- `OFFLINE` - Not connected
- `SUSPENDED` - Account suspended
- `DECOMMISSIONED` - Permanently removed

### MaintenanceScheduleType
- `TIME_BASED` - Based on calendar time
- `MILEAGE_BASED` - Based on odometer reading
- `BOTH` - Whichever comes first
- `CONDITION_BASED` - Based on sensor data

### ReadingType
- `ODOMETER` - Distance odometer
- `HOUR_METER` - Engine hours
- `TRIP_METER` - Trip distance
