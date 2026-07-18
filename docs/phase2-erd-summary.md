# Phase 2: ERD Relationship Summary

## Entity Relationship Diagram - Conceptual View

This document provides a comprehensive summary of all relationships in the Fleet Management SaaS database. Relationships are categorized by cardinality and direction.

---

## Relationship Cardinality Legend

| Symbol | Meaning |
|--------|---------|
| `1:1` | One-to-One |
| `1:N` | One-to-Many |
| `N:M` | Many-to-Many |
| `?` | Optional (nullable) |
| `!` | Required (non-nullable) |

---

## Platform & Tenant Relationships

### Company ↔ User (N:M via CompanyUser)
```
Company (1) ───[CompanyUser]─── (N) User
```
- A Company can have many Users
- A User can belong to many Companies
- `CompanyUser` is the junction table with membership metadata (employeeId, department, isOwner)

### Company ↔ Role (1:N)
```
Company (1) ─── (N) Role
```
- A Company has many custom Roles
- A Role belongs to one Company (or is system-wide with null companyId)
- System roles (isSystem=true) have no companyId and are shared across all companies

### User ↔ Role (N:M via UserRole)
```
User (1) ───[UserRole]─── (N) Role
```
- A User can have many Roles
- A Role can be assigned to many Users
- `UserRole` includes company context (companyId) for multi-tenant role assignment

### User ↔ Session (1:N)
```
User (1) ─── (N) Session
```
- A User can have many active Sessions (devices/browsers)
- Each Session belongs to one User
- Cascade delete: when User is deleted, all Sessions are deleted

### User ↔ RefreshToken (1:N)
```
User (1) ─── (N) RefreshToken
```
- A User can have many RefreshTokens (multiple devices)
- Each RefreshToken belongs to one User
- Cascade delete: when User is deleted, all RefreshTokens are deleted

### User ↔ Driver (1:N?)
```
User (1) ─── (N?) Driver
```
- A User can be linked to multiple Drivers (across different companies)
- A Driver optionally links to one User (for driver app login)
- Optional: Driver.userId is nullable

### User ↔ Notification (1:N)
```
User (1) ─── (N) Notification
```
- A User receives many Notifications
- Each Notification optionally targets one User

### User ↔ NotificationPreference (1:N)
```
User (1) ─── (N) NotificationPreference
```
- A User has many NotificationPreferences (one per type+channel combination)
- Each Preference belongs to one User

### User ↔ AuditLog (1:N)
```
User (1) ─── (N) AuditLog
```
- A User generates many AuditLog entries
- Each AuditLog optionally references one User

### User ↔ ActivityLog (1:N)
```
User (1) ─── (N) ActivityLog
```
- A User generates many ActivityLog entries
- Each ActivityLog optionally references one User

### User ↔ APIKey (1:N)
```
User (1) ─── (N) APIKey
```
- A User can create many APIKeys
- Each APIKey belongs to one User

---

## Fleet Relationships

### Company ↔ VehicleCategory (1:N)
```
Company (1) ─── (N) VehicleCategory
```
- A Company defines many VehicleCategories
- Each VehicleCategory belongs to one Company

### Company ↔ VehicleType (1:N)
```
Company (1) ─── (N) VehicleType
```
- A Company defines many VehicleTypes
- Each VehicleType belongs to one Company

### VehicleCategory ↔ VehicleType (1:N)
```
VehicleCategory (1) ─── (N) VehicleType
```
- A VehicleCategory groups many VehicleTypes
- A VehicleType optionally belongs to one VehicleCategory

### Company ↔ Vehicle (1:N)
```
Company (1) ─── (N) Vehicle
```
- A Company owns many Vehicles
- Each Vehicle belongs to one Company

### VehicleType ↔ Vehicle (1:N)
```
VehicleType (1) ─── (N) Vehicle
```
- A VehicleType is used by many Vehicles
- A Vehicle optionally uses one VehicleType

### VehicleCategory ↔ Vehicle (1:N)
```
VehicleCategory (1) ─── (N) Vehicle
```
- A VehicleCategory groups many Vehicles
- A Vehicle optionally belongs to one VehicleCategory

### Company ↔ Driver (1:N)
```
Company (1) ─── (N) Driver
```
- A Company employs many Drivers
- Each Driver belongs to one Company

### Driver ↔ DriverLicense (1:N)
```
Driver (1) ─── (N) DriverLicense
```
- A Driver can have multiple Licenses (different classes/types)
- Each License belongs to one Driver

### Vehicle ↔ Driver (1:1? Current Assignment)
```
Vehicle (1) ─── (1?) Driver
        currentDriverId
```
- A Vehicle optionally has one current Driver
- To find a Driver's current Vehicle, query Vehicle where currentDriverId = driver.id
- This is a unidirectional optional 1:1 relationship

### Vehicle ↔ Driver (N:M via VehicleAssignment)
```
Vehicle (1) ───[VehicleAssignment]─── (N) Driver
```
- A Vehicle has been assigned to many Drivers over time
- A Driver has been assigned to many Vehicles over time
- `VehicleAssignment` records the assignment history with timestamps

---

## Operations Relationships

### Company ↔ GPSDevice (1:N)
```
Company (1) ─── (N) GPSDevice
```
- A Company manages many GPSDevices
- Each GPSDevice belongs to one Company

### Vehicle ↔ GPSDevice (1:1?)
```
Vehicle (1) ─── (1?) GPSDevice
        gpsDeviceId
```
- A Vehicle optionally has one GPSDevice
- A GPSDevice can be associated with one Vehicle at a time
- Optional: Vehicle.gpsDeviceId is nullable

### Company ↔ VehicleLocation (1:N)
```
Company (1) ─── (N) VehicleLocation
```
- A Company has many VehicleLocation records (GPS data)
- Each VehicleLocation belongs to one Company

### Vehicle ↔ VehicleLocation (1:N)
```
Vehicle (1) ─── (N) VehicleLocation
```
- A Vehicle generates many Location records over time
- Each Location record belongs to one Vehicle

### GPSDevice ↔ VehicleLocation (1:N)
```
GPSDevice (1) ─── (N) VehicleLocation
```
- A GPSDevice generates many Location records
- Each Location record optionally references one GPSDevice

### Company ↔ Route (1:N)
```
Company (1) ─── (N) Route
```
- A Company defines many Routes
- Each Route belongs to one Company

### Route ↔ RouteStop (1:N)
```
Route (1) ─── (N) RouteStop
```
- A Route has many ordered Stops
- Each RouteStop belongs to one Route

### Route ↔ Waypoint (1:N)
```
Route (1) ─── (N) Waypoint
```
- A Route has many ordered Waypoints
- Each Waypoint belongs to one Route

### Company ↔ Trip (1:N)
```
Company (1) ─── (N) Trip
```
- A Company operates many Trips
- Each Trip belongs to one Company

### Vehicle ↔ Trip (1:N)
```
Vehicle (1) ─── (N) Trip
```
- A Vehicle performs many Trips over time
- Each Trip uses one Vehicle

### Driver ↔ Trip (1:N)
```
Driver (1) ─── (N) Trip
```
- A Driver operates many Trips over time
- Each Trip is driven by one Driver

### Route ↔ Trip (1:N)
```
Route (1) ─── (N) Trip
```
- A Route is used by many Trips
- A Trip optionally follows one Route

### Customer ↔ Trip (1:N)
```
Customer (1) ─── (N) Trip
```
- A Customer books many Trips
- A Trip optionally serves one Customer

### Trip ↔ TripStop (1:N)
```
Trip (1) ─── (N) TripStop
```
- A Trip has many Stops
- Each TripStop belongs to one Trip

### RouteStop ↔ TripStop (1:N)
```
RouteStop (1) ─── (N) TripStop
```
- A RouteStop is used by many TripStops (across different trips)
- A TripStop optionally references one RouteStop (template)

### Company ↔ Geofence (1:N)
```
Company (1) ─── (N) Geofence
```
- A Company defines many Geofences
- Each Geofence belongs to one Company

### Geofence ↔ GeofenceAlert (1:N)
```
Geofence (1) ─── (N) GeofenceAlert
```
- A Geofence generates many Alert events
- Each Alert belongs to one Geofence

### Vehicle ↔ GeofenceAlert (1:N)
```
Vehicle (1) ─── (N) GeofenceAlert
```
- A Vehicle triggers many Geofence Alerts
- Each Alert belongs to one Vehicle

### Driver ↔ GeofenceAlert (1:N?)
```
Driver (1) ─── (N?) GeofenceAlert
```
- A Driver (operating a vehicle) triggers many Alerts
- Each Alert optionally references the Driver

### Company ↔ FuelLog (1:N)
```
Company (1) ─── (N) FuelLog
```
- A Company records many Fuel purchases
- Each FuelLog belongs to one Company

### Vehicle ↔ FuelLog (1:N)
```
Vehicle (1) ─── (N) FuelLog
```
- A Vehicle has many FuelLog entries
- Each FuelLog belongs to one Vehicle

### Driver ↔ FuelLog (1:N?)
```
Driver (1) ─── (N?) FuelLog
```
- A Driver makes many Fuel purchases
- A FuelLog optionally references the Driver

### Trip ↔ FuelLog (1:N?)
```
Trip (1) ─── (N?) FuelLog
```
- A Trip has FuelLog entries (for trip fueling)
- A FuelLog optionally belongs to one Trip

### Company ↔ OdometerReading (1:N)
```
Company (1) ─── (N) OdometerReading
```
- A Company has many OdometerReading records
- Each OdometerReading belongs to one Company

### Vehicle ↔ OdometerReading (1:N)
```
Vehicle (1) ─── (N) OdometerReading
```
- A Vehicle has many OdometerReading records over time
- Each OdometerReading belongs to one Vehicle

### Driver ↔ OdometerReading (1:N?)
```
Driver (1) ─── (N?) OdometerReading
```
- A Driver records many OdometerReadings
- An OdometerReading optionally references the Driver

### Trip ↔ OdometerReading (1:N?)
```
Trip (1) ─── (N?) OdometerReading
```
- A Trip has OdometerReadings (start/end)
- An OdometerReading optionally belongs to one Trip

---

## Maintenance Relationships

### Company ↔ ServiceCenter (1:N)
```
Company (1) ─── (N) ServiceCenter
```
- A Company uses many ServiceCenters
- Each ServiceCenter belongs to one Company

### Company ↔ MaintenanceSchedule (1:N)
```
Company (1) ─── (N) MaintenanceSchedule
```
- A Company has many MaintenanceSchedules
- Each MaintenanceSchedule belongs to one Company

### Vehicle ↔ MaintenanceSchedule (1:N)
```
Vehicle (1) ─── (N) MaintenanceSchedule
```
- A Vehicle has many MaintenanceSchedules (different types)
- Each MaintenanceSchedule belongs to one Vehicle

### Company ↔ MaintenanceRecord (1:N)
```
Company (1) ─── (N) MaintenanceRecord
```
- A Company records many MaintenanceRecords
- Each MaintenanceRecord belongs to one Company

### Vehicle ↔ MaintenanceRecord (1:N)
```
Vehicle (1) ─── (N) MaintenanceRecord
```
- A Vehicle has many MaintenanceRecords over its lifetime
- Each MaintenanceRecord belongs to one Vehicle

### MaintenanceSchedule ↔ MaintenanceRecord (1:N?)
```
MaintenanceSchedule (1) ─── (N?) MaintenanceRecord
```
- A MaintenanceSchedule generates many MaintenanceRecords (recurring)
- A MaintenanceRecord optionally references one Schedule

### ServiceCenter ↔ MaintenanceRecord (1:N?)
```
ServiceCenter (1) ─── (N?) MaintenanceRecord
```
- A ServiceCenter performs many MaintenanceRecords
- A MaintenanceRecord optionally uses one ServiceCenter

### MaintenanceRecord ↔ SparePart (1:N)
```
MaintenanceRecord (1) ─── (N) SparePart
```
- A MaintenanceRecord uses many SpareParts
- Each SparePart belongs to one MaintenanceRecord

### Company ↔ SparePart (1:N)
```
Company (1) ─── (N) SparePart
```
- A Company records many SpareParts
- Each SparePart belongs to one Company

### MaintenanceRecord ↔ MaintenanceCost (1:N)
```
MaintenanceRecord (1) ─── (N) MaintenanceCost
```
- A MaintenanceRecord has many Cost line items
- Each MaintenanceCost belongs to one MaintenanceRecord

### Company ↔ MaintenanceCost (1:N)
```
Company (1) ─── (N) MaintenanceCost
```
- A Company records many MaintenanceCosts
- Each MaintenanceCost belongs to one Company

---

## Documents Relationships

### Company ↔ VehicleDocument (1:N)
```
Company (1) ─── (N) VehicleDocument
```
- A Company has many VehicleDocuments
- Each VehicleDocument belongs to one Company

### Vehicle ↔ VehicleDocument (1:N)
```
Vehicle (1) ─── (N) VehicleDocument
```
- A Vehicle has many Documents (registration, insurance, etc.)
- Each VehicleDocument belongs to one Vehicle

### Company ↔ DriverDocument (1:N)
```
Company (1) ─── (N) DriverDocument
```
- A Company has many DriverDocuments
- Each DriverDocument belongs to one Company

### Driver ↔ DriverDocument (1:N)
```
Driver (1) ─── (N) DriverDocument
```
- A Driver has many Documents (license, medical, etc.)
- Each DriverDocument belongs to one Driver

### Company ↔ Insurance (1:N)
```
Company (1) ─── (N) Insurance
```
- A Company manages many Insurance policies
- Each Insurance policy belongs to one Company

### Vehicle ↔ Insurance (1:N)
```
Vehicle (1) ─── (N) Insurance
```
- A Vehicle has many Insurance policies (over time)
- Each Insurance policy belongs to one Vehicle

### Company ↔ Inspection (1:N)
```
Company (1) ─── (N) Inspection
```
- A Company records many Inspections
- Each Inspection belongs to one Company

### Vehicle ↔ Inspection (1:N)
```
Vehicle (1) ─── (N) Inspection
```
- A Vehicle has many Inspections over time
- Each Inspection belongs to one Vehicle

---

## Finance Relationships

### Company ↔ Customer (1:N)
```
Company (1) ─── (N) Customer
```
- A Company has many Customers
- Each Customer belongs to one Company

### Company ↔ Invoice (1:N)
```
Company (1) ─── (N) Invoice
```
- A Company issues many Invoices
- Each Invoice belongs to one Company

### Customer ↔ Invoice (1:N?)
```
Customer (1) ─── (N?) Invoice
```
- A Customer receives many Invoices
- An Invoice optionally belongs to one Customer

### CompanySubscription ↔ Invoice (1:N?)
```
CompanySubscription (1) ─── (N?) Invoice
```
- A Subscription generates many Invoices (monthly/quarterly/yearly)
- An Invoice optionally belongs to one Subscription

### Invoice ↔ Payment (1:N)
```
Invoice (1) ─── (N) Payment
```
- An Invoice has many Payments (partial payments, refunds)
- Each Payment optionally belongs to one Invoice

### Company ↔ Payment (1:N)
```
Company (1) ─── (N) Payment
```
- A Company records many Payments
- Each Payment belongs to one Company

### Customer ↔ Payment (1:N?)
```
Customer (1) ─── (N?) Payment
```
- A Customer makes many Payments
- A Payment optionally belongs to one Customer

### Company ↔ Expense (1:N)
```
Company (1) ─── (N) Expense
```
- A Company records many Expenses
- Each Expense belongs to one Company

### Trip ↔ Expense (1:N?)
```
Trip (1) ─── (N?) Expense
```
- A Trip has many Expenses (fuel, tolls, etc.)
- An Expense optionally belongs to one Trip

### Customer ↔ Expense (1:N?)
```
Customer (1) ─── (N?) Expense
```
- A Customer may have billable Expenses
- An Expense optionally belongs to one Customer

### Invoice ↔ Expense (1:N?)
```
Invoice (1) ─── (N?) Expense
```
- An Invoice may include Expenses
- An Expense optionally belongs to one Invoice

---

## Communication Relationships

### Company ↔ Notification (1:N)
```
Company (1) ─── (N) Notification
```
- A Company generates many Notifications
- Each Notification belongs to one Company

### Company ↔ NotificationPreference (1:N)
```
Company (1) ─── (N) NotificationPreference
```
- A Company has many NotificationPreferences
- Each Preference belongs to one Company

---

## Reports & Auditing Relationships

### Company ↔ AuditLog (1:N)
```
Company (1) ─── (N) AuditLog
```
- A Company generates many AuditLog entries
- Each AuditLog belongs to one Company

### Company ↔ ActivityLog (1:N)
```
Company (1) ─── (N) ActivityLog
```
- A Company generates many ActivityLog entries
- Each ActivityLog belongs to one Company

### Driver ↔ ActivityLog (1:N?)
```
Driver (1) ─── (N?) ActivityLog
```
- A Driver generates many ActivityLog entries
- An ActivityLog optionally references a Driver

### Driver ↔ Notification (1:N?)
```
Driver (1) ─── (N?) Notification
```
- A Driver receives many Notifications
- A Notification optionally targets a Driver

---

## SaaS Relationships

### SubscriptionPlan ↔ CompanySubscription (1:N)
```
SubscriptionPlan (1) ─── (N) CompanySubscription
```
- A Plan is subscribed by many Companies
- Each CompanySubscription belongs to one Plan

### Company ↔ CompanySubscription (1:1)
```
Company (1) ─── (1) CompanySubscription
```
- A Company has one active Subscription
- Each Subscription belongs to one Company
- Enforced by unique constraint on CompanySubscription.companyId

### Company ↔ APIKey (1:N)
```
Company (1) ─── (N) APIKey
```
- A Company can have many APIKeys
- Each APIKey belongs to one Company

### Company ↔ Webhook (1:N)
```
Company (1) ─── (N) Webhook
```
- A Company configures many Webhooks
- Each Webhook belongs to one Company

---

## Complete Entity Relationship Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PLATFORM (GLOBAL)                            │
│  User ───────┬────── Session, RefreshToken, APIKey                  │
│              │                                                       │
│              └────── CompanyUser ─── Company ─── SubscriptionPlan    │
│                          │                  │                       │
│              UserRole ───┴── Role ──────────┘                       │
│                          │                                          │
│                          └── CompanySubscription                      │
│                                                                    │
│                        PERMISSION (GLOBAL)                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      TENANT (PER-COMPANY)                             │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ Vehicle  │───▶│  Driver  │───▶│   Trip   │───▶│ Customer │      │
│  │Category  │    │ License  │    │  Stop    │    │  Invoice │      │
│  │  Type    │    │Assignment│    │  Route   │    │  Payment │      │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘      │
│       │              │              │              │                │
│       │              │              │              │                │
│       ▼              ▼              ▼              ▼                │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ GPSDevice│───▶│VehicleLocation│    │ Geofence │    │ Expense  │      │
│  │          │    │  Waypoint   │    │  Alert   │    │          │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │Maintenance│───▶│ SparePart│    │VehicleDoc│    │DriverDoc │      │
│  │ Schedule │    │  Cost    │    │Insurance │    │Inspection│      │
│  │  Record  │    │          │    │          │    │          │      │
│  │ Service  │    └──────────┘    └──────────┘    └──────────┘      │
│  │  Center  │                                                       │
│  └──────────┘                                                       │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │Notification│    │Notification│    │ AuditLog │    │ActivityLog│      │
│  │          │    │Preference│    │          │    │          │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│                                                                     │
│  ┌──────────┐    ┌──────────┐                                     │
│  │  FuelLog │    │Odometer  │                                     │
│  │          │    │ Reading  │                                     │
│  └──────────┘    └──────────┘                                     │
│                                                                     │
│  ┌──────────┐    ┌──────────┐                                     │
│  │  APIKey  │    │ Webhook  │                                     │
│  └──────────┘    └──────────┘                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Foreign Key Optimization Summary

| Parent Table | Child Table | Foreign Key | Cascade | Notes |
|-------------|-------------|-------------|---------|-------|
| Company | All tenant tables | companyId | Cascade | Every tenant model links to Company |
| User | CompanyUser | userId | Cascade | Deleting user removes all memberships |
| User | Session | userId | Cascade | Sessions die with user |
| User | RefreshToken | userId | Cascade | Tokens die with user |
| User | UserRole | userId | Cascade | Roles revoked on user deletion |
| Company | CompanyUser | companyId | Cascade | Memberships die with company |
| Company | Role | companyId | Cascade | Custom roles die with company |
| Company | UserRole | companyId | Cascade | Role assignments die with company |
| Company | Vehicle | companyId | Cascade | Fleet dies with company |
| Company | Driver | companyId | Cascade | Drivers die with company |
| Vehicle | VehicleAssignment | vehicleId | Cascade | History preserved... actually cascade |
| Vehicle | Trip | vehicleId | Cascade | Trips die with vehicle |
| Vehicle | FuelLog | vehicleId | Cascade | Logs die with vehicle |
| Vehicle | OdometerReading | vehicleId | Cascade | Readings die with vehicle |
| Vehicle | MaintenanceRecord | vehicleId | Cascade | Records die with vehicle |
| Vehicle | VehicleDocument | vehicleId | Cascade | Documents die with vehicle |
| Vehicle | Insurance | vehicleId | Cascade | Policies die with vehicle |
| Vehicle | Inspection | vehicleId | Cascade | Inspections die with vehicle |
| Vehicle | VehicleLocation | vehicleId | Cascade | GPS data dies with vehicle |
| Driver | VehicleAssignment | driverId | Cascade | History dies with driver |
| Driver | Trip | driverId | Cascade | Trips die with driver |
| Driver | FuelLog | driverId | SetNull | Keep fuel logs for vehicle |
| Driver | OdometerReading | driverId | SetNull | Keep readings for vehicle |
| Driver | DriverDocument | driverId | Cascade | Documents die with driver |
| Driver | DriverLicense | driverId | Cascade | Licenses die with driver |
| Trip | TripStop | tripId | Cascade | Stops die with trip |
| Trip | FuelLog | tripId | SetNull | Keep fuel logs for vehicle |
| Trip | OdometerReading | tripId | SetNull | Keep readings for vehicle |
| Trip | Expense | tripId | SetNull | Keep expenses for company |
| Route | RouteStop | routeId | Cascade | Stops die with route |
| Route | Waypoint | routeId | Cascade | Waypoints die with route |
| Route | Trip | routeId | SetNull | Keep trips even if route deleted |
| MaintenanceSchedule | MaintenanceRecord | scheduleId | SetNull | Keep records even if schedule deleted |
| MaintenanceRecord | SparePart | maintenanceRecordId | Cascade | Parts die with record |
| MaintenanceRecord | MaintenanceCost | maintenanceRecordId | Cascade | Costs die with record |
| ServiceCenter | MaintenanceRecord | serviceCenterId | SetNull | Keep records if center deleted |
| Customer | Trip | customerId | SetNull | Keep trips if customer deleted |
| Customer | Invoice | customerId | SetNull | Keep invoices if customer deleted |
| Customer | Payment | customerId | SetNull | Keep payments if customer deleted |
| Customer | Expense | customerId | SetNull | Keep expenses if customer deleted |
| Invoice | Payment | invoiceId | SetNull | Keep payments if invoice deleted |
| Invoice | Expense | invoiceId | SetNull | Keep expenses if invoice deleted |
| CompanySubscription | Invoice | subscriptionId | SetNull | Keep invoices if subscription changed |
| SubscriptionPlan | CompanySubscription | planId | Restrict | Cannot delete plan with active subscriptions |
| GPSDevice | VehicleLocation | deviceId | SetNull | Keep locations if device deleted |
| Company | Geofence | companyId | Cascade | Geofences die with company |
| Geofence | GeofenceAlert | geofenceId | Cascade | Alerts die with geofence |
| Vehicle | GeofenceAlert | vehicleId | Cascade | Alerts die with vehicle |
| Driver | GeofenceAlert | driverId | SetNull | Keep alerts if driver deleted |
| User | Notification | userId | SetNull | Keep notifications if user deleted |
| Driver | Notification | driverId | SetNull | Keep notifications if driver deleted |
| Company | Notification | companyId | Cascade | Notifications die with company |
| Company | NotificationPreference | companyId | Cascade | Preferences die with company |
| User | NotificationPreference | userId | Cascade | Preferences die with user |
| Company | AuditLog | companyId | Cascade | Audit logs die with company |
| User | AuditLog | userId | SetNull | Keep audit logs if user deleted |
| Company | ActivityLog | companyId | Cascade | Activity logs die with company |
| User | ActivityLog | userId | SetNull | Keep logs if user deleted |
| Driver | ActivityLog | driverId | SetNull | Keep logs if driver deleted |
| Company | APIKey | companyId | Cascade | API keys die with company |
| User | APIKey | userId | Cascade | API keys die with user |
| Company | Webhook | companyId | Cascade | Webhooks die with company |

---

## Key Design Decisions

### 1. Unidirectional vs Bidirectional Relations

Most relations are **bidirectional** (both sides have relation fields) to enable queries from either direction. However, a few are **unidirectional** by design:

- **Vehicle.currentDriver → Driver**: Unidirectional. To find a driver's current vehicle, query `Vehicle` where `currentDriverId = driver.id`. This avoids circular references and keeps the schema cleaner.
- **Vehicle.gpsDevice → GPSDevice**: Unidirectional. GPSDevice does not have a `vehicle` field to avoid confusion.

### 2. Optional vs Required Relations

- **Required relations** (no `?`): Company→all, User→Session, Vehicle→Trip, Driver→Trip, etc. These enforce data integrity at the database level.
- **Optional relations** (`?`): Trip→Route, Trip→Customer, MaintenanceRecord→Schedule, FuelLog→Trip, etc. These allow flexibility when parent data is deleted or not yet assigned.

### 3. Cascade Strategy

- **Cascade delete**: Used when child data has no meaning without the parent (e.g., RouteStop without Route, TripStop without Trip).
- **SetNull**: Used when child data should be preserved even if the parent is deleted (e.g., FuelLog without Driver, Trip without Customer).
- **Restrict**: Used for SubscriptionPlan to prevent accidental deletion with active subscriptions.

### 4. Self-Referencing Relations

There are no self-referencing relations in this schema. All hierarchies are flat or use explicit junction tables.

### 5. Polymorphic Relations

The schema does not use polymorphic relations (which Prisma does not support natively). Instead, explicit typed relations are used:
- `VehicleDocument` and `DriverDocument` are separate models rather than a single polymorphic `Document` model.
- `AuditLog` and `ActivityLog` use `entityType` (string) + `entityId` (UUID) for generic referencing, which is a manual polymorphic pattern.

This design is more explicit and performant than polymorphic associations.

### 6. Junction Table Patterns

Three explicit junction tables are used:
- **CompanyUser**: User-Company membership with metadata
- **UserRole**: User-Role assignment with company context
- **VehicleAssignment**: Vehicle-Driver assignment history with timestamps

No implicit junction tables (Prisma's implicit many-to-many) are used, as explicit junction tables provide better control over additional fields and indexing.
