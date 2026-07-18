# Phase 14: Notifications & Communication Hub — Documentation

## Overview

The Notifications & Communication Hub is a centralized, event-driven notification system used by every module in the Fleet Management SaaS. It supports real-time, email, push, SMS, and WebSocket notifications with a provider abstraction layer for future integrations.

## Architecture

### Clean Architecture Layers

```
src/modules/notification/
├── providers/          # Provider adapters (InApp, Email, Push, SMS, WebSocket)
├── engine/             # Notification engine (orchestration, queue processing)
├── repositories/       # Data access (Notification, DeliveryLog)
├── services/           # Business logic (NotificationService)
├── controllers/        # HTTP controllers (NotificationController)
├── validators/         # Zod schemas
└── __tests__/          # Unit & integration tests

src/modules/delivery-queue/
├── repositories/       # DeliveryQueueRepository
├── services/           # DeliveryQueueService
├── controllers/        # DeliveryQueueController
└── validators/         # Zod schemas

src/modules/communication-center/
├── repositories/       # CommunicationThreadRepository, CommunicationMessageRepository
├── services/           # CommunicationCenterService
├── controllers/        # CommunicationCenterController
└── validators/         # Zod schemas

src/modules/notification-template/
├── repositories/       # NotificationTemplateRepository
├── services/           # NotificationTemplateService
├── controllers/        # NotificationTemplateController
└── validators/         # Zod schemas

src/modules/notification-preference/
├── repositories/       # NotificationPreferenceRepository
├── services/           # NotificationPreferenceService
├── controllers/        # NotificationPreferenceController
└── validators/         # Zod schemas
```

## Provider Abstraction

All providers implement the `NotificationProvider` interface:

```typescript
interface NotificationProvider {
  name: string;
  channel: NotificationChannel;
  isConfigured(): boolean;
  send(payload: NotificationPayload, recipient?: RecipientInfo): Promise<DeliveryResult>;
}
```

### Supported Providers

| Provider | Channel | Configuration |
|----------|---------|--------------|
| InApp | IN_APP | Always enabled (writes to DB) |
| Resend | EMAIL | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| FCM | PUSH | `FCM_SERVER_KEY` |
| Twilio | SMS | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_PHONE` |
| Socket.IO | WEBHOOK | Socket server initialized at `/api/socket` |

### Adding a New Provider

1. Create `src/modules/notification/providers/new.provider.ts`
2. Implement `NotificationProvider` interface
3. Register in `src/modules/notification/providers/registry.ts`

## Notification Lifecycle

```
Event Triggered
      ↓
Notification Engine
      ↓
Check User Preferences
      ↓
Check Quiet Hours
      ↓
Resolve Recipients
      ↓
Provider Registry
      ↓
Provider.send()
      ↓
Delivery Log Created
      ↓
WebSocket Emitted (if IN_APP)
```

## Notification Types

28 built-in notification types across 7 categories:

- **Fleet Operations**: TRIP_STARTED, TRIP_COMPLETED, ROUTE_DEVIATION, DRIVER_ASSIGNMENT, VEHICLE_ASSIGNMENT, VEHICLE_OFFLINE, GPS_OFFLINE
- **Maintenance**: SERVICE_DUE, SERVICE_OVERDUE, WORK_ORDER_ASSIGNED, WORK_ORDER_COMPLETED
- **Fuel**: LOW_FUEL_EFFICIENCY, SUSPICIOUS_FUEL_ACTIVITY, FUEL_CARD_EXPIRED
- **Compliance**: INSURANCE_EXPIRY, INSPECTION_DUE, DRIVER_LICENSE_EXPIRY, MEDICAL_CERTIFICATE_EXPIRY
- **Administration**: USER_INVITATION, PASSWORD_RESET, LOGIN_ALERT, ROLE_CHANGED
- **Billing**: SUBSCRIPTION_EXPIRING, PAYMENT_RECEIVED, PAYMENT_FAILED
- **System**: ERROR_ALERT, SECURITY_ALERT, BACKUP_COMPLETED
- **Custom**: CUSTOM (unlimited extensibility)

## API Endpoints

### Notifications
- `GET /api/notifications` — List notifications
- `POST /api/notifications` — Create notification
- `GET /api/notifications/:id` — Get notification details
- `PUT /api/notifications/:id/read` — Mark as read
- `PUT /api/notifications/read-all` — Mark all as read
- `PATCH /api/notifications/:id` — Update notification
- `DELETE /api/notifications/:id` — Delete notification
- `GET /api/notifications/stats` — Get notification stats

### Delivery Queue
- `GET /api/delivery-queue` — List queue items
- `POST /api/delivery-queue` — Create queue item
- `GET /api/delivery-queue/:id` — Get queue item
- `PATCH /api/delivery-queue/:id` — Update queue item
- `DELETE /api/delivery-queue/:id` — Delete queue item

### Templates
- `GET /api/templates` — List templates
- `POST /api/templates` — Create template
- `GET /api/templates/:id` — Get template
- `PUT /api/templates/:id` — Update template
- `DELETE /api/templates/:id` — Delete template

### Communication Center
- `GET /api/communication-center` — List threads
- `POST /api/communication-center` — Create thread
- `GET /api/communication-center/:id` — Get thread
- `GET /api/communication-center/:id/messages` — Get messages
- `POST /api/communication-center/:id/messages` — Send message

### Preferences
- `GET /api/notification-preferences` — Get preferences
- `PUT /api/notification-preferences` — Update preferences

## WebSocket Events

- `notification:new` — New notification received
- `notification:read` — Notification marked as read
- `notification:deleted` — Notification deleted
- `notification:updated` — Notification updated
- `system:alert` — System-wide alert

### Socket.IO Client Hook

```typescript
import { useNotificationsSocket } from '@/hooks/use-notifications-socket';

useNotificationsSocket({
  companyId: 'your-company-id',
  userId: 'your-user-id',
  onNewNotification: (data) => { /* handle new notification */ },
  onSystemAlert: (data) => { /* handle system alert */ },
});
```

## Frontend Pages

- `/notifications` — Notification Center Dashboard
- `/notifications/inbox` — Communication Inbox with bulk actions
- `/notifications/queue` — Delivery Queue management
- `/notifications/templates` — Template Manager
- `/notifications/communication` — Communication Center (chat-style)
- `/notifications/preferences` — User Preferences
- `/notifications/analytics` — Delivery Analytics

## Queue Architecture

The delivery queue uses a simple async processing model:

1. Notification events are queued in `DeliveryQueue` table
2. Queue items processed by `NotificationEngine.processQueue()`
3. Retry logic: max 3 retries, then marked as FAILED
4. Status tracking: QUEUED → PROCESSING → SENT/DELIVERED/FAILED/RETRYING/CANCELLED

### Future Worker Integration

The queue abstraction supports replacing the in-process worker with:
- BullMQ (Redis-backed)
- RabbitMQ
- AWS SQS
- Google Cloud Tasks

## Security

- Multi-tenant isolation via `companyId` on all queries
- JWT authentication on all API routes
- Input validation with Zod schemas
- Rate limiting ready (middleware placeholder)
- Audit logging on critical actions

## Environment Variables

```env
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=notifications@limifleet.com
FCM_SERVER_KEY=your-fcm-server-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_PHONE=+1234567890
```
