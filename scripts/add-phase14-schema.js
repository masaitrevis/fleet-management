const fs = require('fs');
const path = require('path');

const schemaFile = '/root/.openclaw/workspace/fleet-management-saas/prisma/schema.prisma';
let schema = fs.readFileSync(schemaFile, 'utf8');

const newSection = `
// ============================================================================
// NOTIFICATIONS & COMMUNICATION
// ============================================================================

enum NotificationChannel {
  IN_APP
  EMAIL
  PUSH
  SMS
  WEBSOCKET
}

enum NotificationStatus {
  PENDING
  SENT
  DELIVERED
  READ
  FAILED
  ARCHIVED
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  CRITICAL
}

enum NotificationType {
  TRIP_STARTED
  TRIP_COMPLETED
  ROUTE_DEVIATION
  DRIVER_ASSIGNMENT
  VEHICLE_ASSIGNMENT
  VEHICLE_OFFLINE
  GPS_OFFLINE
  SERVICE_DUE
  SERVICE_OVERDUE
  WORK_ORDER_ASSIGNED
  WORK_ORDER_COMPLETED
  LOW_FUEL_EFFICIENCY
  SUSPICIOUS_FUEL_ACTIVITY
  FUEL_CARD_EXPIRED
  INSURANCE_EXPIRY
  INSPECTION_DUE
  DRIVER_LICENSE_EXPIRY
  MEDICAL_CERTIFICATE_EXPIRY
  USER_INVITATION
  PASSWORD_RESET
  LOGIN_ALERT
  ROLE_CHANGED
  SUBSCRIPTION_EXPIRING
  PAYMENT_RECEIVED
  PAYMENT_FAILED
  ERROR_ALERT
  SECURITY_ALERT
  BACKUP_COMPLETED
  CUSTOM
}

enum DeliveryStatus {
  QUEUED
  PROCESSING
  SENT
  DELIVERED
  FAILED
  RETRYING
  CANCELLED
}

enum TemplateType {
  HTML_EMAIL
  PLAIN_TEXT_EMAIL
  SMS
  PUSH
  IN_APP
}

enum DigestFrequency {
  IMMEDIATE
  HOURLY
  DAILY
  WEEKLY
}

model Notification {
  id                String              @id @default(uuid())
  companyId         String
  company           Company             @relation(fields: [companyId], references: [id])
  userId            String?
  user              User?               @relation(fields: [userId], references: [id], name: "UserNotifications")
  title             String
  body              String              @db.Text
  type              NotificationType
  category          String?
  channel           NotificationChannel
  priority          NotificationPriority @default(NORMAL)
  status            NotificationStatus   @default(PENDING)
  readAt            DateTime?
  archivedAt        DateTime?
  actionUrl         String?
  actionLabel       String?
  imageUrl          String?
  metadata          String?             @db.Text
  relatedEntityType String?
  relatedEntityId   String?
  sentAt            DateTime?
  deliveredAt       DateTime?
  failedAt          DateTime?
  failureReason     String?
  retryCount        Int                 @default(0)
  maxRetries        Int                 @default(3)
  scheduledFor      DateTime?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  deletedAt         DateTime?

  deliveryLogs      NotificationDeliveryLog[]
  template          NotificationTemplate?   @relation(fields: [templateId], references: [id])
  templateId        String?

  @@index([companyId, status])
  @@index([companyId, userId, status])
  @@index([companyId, type])
  @@index([companyId, createdAt])
  @@index([companyId, priority])
  @@index([companyId, scheduledFor])
  @@index([companyId, deletedAt])
  @@index([userId, status])
}

model NotificationPreference {
  id                String              @id @default(uuid())
  companyId         String
  company           Company             @relation(fields: [companyId], references: [id])
  userId            String
  user              User                @relation(fields: [userId], references: [id], name: "UserNotificationPreferences")
  notificationType  NotificationType
  channels          NotificationChannel[]
  enabled           Boolean             @default(true)
  quietHoursStart   String?
  quietHoursEnd     String?
  digestFrequency   DigestFrequency     @default(IMMEDIATE)
  language          String              @default("en")
  timezone          String              @default("UTC")
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@unique([companyId, userId, notificationType])
  @@index([companyId, userId])
  @@index([companyId, notificationType])
}

model NotificationTemplate {
  id                String              @id @default(uuid())
  companyId         String
  company           Company             @relation(fields: [companyId], references: [id])
  name              String
  description       String?
  templateType      TemplateType
  subject           String?
  body              String              @db.Text
  variables         String?             @db.Text
  isActive          Boolean             @default(true)
  isDefault         Boolean             @default(false)
  category          String?
  notificationType  NotificationType?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  deletedAt         DateTime?

  notifications     Notification[]

  @@index([companyId, isActive])
  @@index([companyId, templateType])
  @@index([companyId, notificationType])
}

model NotificationDeliveryLog {
  id                String              @id @default(uuid())
  notificationId    String
  notification      Notification        @relation(fields: [notificationId], references: [id])
  channel           NotificationChannel
  status            DeliveryStatus
  provider          String?
  providerResponse  String?             @db.Text
  errorMessage      String?
  sentAt            DateTime?
  deliveredAt       DateTime?
  failedAt          DateTime?
  retryCount        Int                 @default(0)
  createdAt         DateTime            @default(now())

  @@index([notificationId, status])
  @@index([notificationId, channel])
  @@index([status, createdAt])
}

model DeliveryQueue {
  id                String              @id @default(uuid())
  companyId         String
  company           Company             @relation(fields: [companyId], references: [id])
  notificationId    String
  channel           NotificationChannel
  priority          NotificationPriority @default(NORMAL)
  status            DeliveryStatus      @default(QUEUED)
  scheduledFor      DateTime?
  processedAt       DateTime?
  failedAt          DateTime?
  errorMessage      String?
  retryCount        Int                 @default(0)
  maxRetries        Int                 @default(3)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([companyId, status])
  @@index([companyId, scheduledFor])
  @@index([status, priority])
  @@index([companyId, notificationId])
}

model CommunicationThread {
  id                String              @id @default(uuid())
  companyId         String
  company           Company             @relation(fields: [companyId], references: [id])
  subject           String
  participants      String[]
  lastMessageAt     DateTime?
  isArchived        Boolean             @default(false)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  deletedAt         DateTime?

  messages          CommunicationMessage[]

  @@index([companyId, participants])
  @@index([companyId, lastMessageAt])
  @@index([companyId, isArchived])
}

model CommunicationMessage {
  id                String              @id @default(uuid())
  threadId          String
  thread            CommunicationThread @relation(fields: [threadId], references: [id])
  senderId          String
  senderType        String              @default("USER")
  content           String              @db.Text
  attachments       String[]
  isRead            Boolean             @default(false)
  readAt            DateTime?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  deletedAt         DateTime?

  @@index([threadId, createdAt])
  @@index([threadId, isRead])
  @@index([senderId, createdAt])
}

`;

const insertBefore = '// ============================================================================\n// MAINTENANCE\n// ============================================================================';
if (!schema.includes('NotificationChannel')) {
  schema = schema.replace(insertBefore, newSection + insertBefore);
  fs.writeFileSync(schemaFile, schema);
  console.log('Phase 14 schema added');
} else {
  console.log('Phase 14 schema already exists');
}

// Add company relations
const companyRelationBlock = '  notifications         Notification[]\n  notificationPreferences NotificationPreference[]\n  notificationTemplates   NotificationTemplate[]\n  deliveryQueues          DeliveryQueue[]\n  communicationThreads    CommunicationThread[]\n';

if (!schema.includes('notifications         Notification[]')) {
  schema = fs.readFileSync(schemaFile, 'utf8');
  const companyBlock = schema.match(/model Company \{[\s\S]*?\}/);
  if (companyBlock) {
    const newCompany = companyBlock[0].replace(
      /(  fleetManagers\s+User\[\]\s*\n)/,
      `$1${companyRelationBlock}`
    );
    schema = schema.replace(companyBlock[0], newCompany);
    fs.writeFileSync(schemaFile, schema);
    console.log('Company relations added');
  }
}

// Add user relations
if (!schema.includes('UserNotifications')) {
  schema = fs.readFileSync(schemaFile, 'utf8');
  const userBlock = schema.match(/model User \{[\s\S]*?\}/);
  if (userBlock) {
    const newUser = userBlock[0].replace(
      /(  driverAssignments\s+DriverVehicleAssignment\[\]\s*\n)/,
      `  notifications             Notification[]           @relation(name: "UserNotifications")\n  notificationPreferences   NotificationPreference[] @relation(name: "UserNotificationPreferences")\n  $1`
    );
    schema = schema.replace(userBlock[0], newUser);
    fs.writeFileSync(schemaFile, schema);
    console.log('User relations added');
  }
}

console.log('Phase 14 schema complete');
