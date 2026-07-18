const fs = require('fs');

const schemaFile = '/root/.openclaw/workspace/fleet-management-saas/prisma/schema.prisma';
let schema = fs.readFileSync(schemaFile, 'utf8');

// Check if the full Phase 14 models exist
if (schema.includes('model NotificationTemplate')) {
  console.log('Phase 14 models already exist');
  process.exit(0);
}

const newModels = `

// ============================================================================
// NOTIFICATIONS & COMMUNICATION (Phase 14)
// ============================================================================

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

model NotificationPreference {
  id                String              @id @default(uuid()) @db.Uuid
  companyId         String              @db.Uuid
  company           Company             @relation(fields: [companyId], references: [id])
  userId            String              @db.Uuid
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
  @@map("notification_preferences")
}

model NotificationTemplate {
  id                String              @id @default(uuid()) @db.Uuid
  companyId         String              @db.Uuid
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
  @@map("notification_templates")
}

model NotificationDeliveryLog {
  id                String              @id @default(uuid()) @db.Uuid
  notificationId    String              @db.Uuid
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
  @@map("notification_delivery_logs")
}

model DeliveryQueue {
  id                String              @id @default(uuid()) @db.Uuid
  companyId         String              @db.Uuid
  company           Company             @relation(fields: [companyId], references: [id])
  notificationId    String              @db.Uuid
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
  @@map("delivery_queue")
}

model CommunicationThread {
  id                String              @id @default(uuid()) @db.Uuid
  companyId         String              @db.Uuid
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
  @@map("communication_threads")
}

model CommunicationMessage {
  id                String              @id @default(uuid()) @db.Uuid
  threadId          String              @db.Uuid
  thread            CommunicationThread @relation(fields: [threadId], references: [id])
  senderId          String              @db.Uuid
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
  @@map("communication_messages")
}
`;

schema = schema + newModels;
fs.writeFileSync(schemaFile, schema);
console.log('Phase 14 models appended to schema');
