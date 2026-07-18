const fs = require('fs');

const schemaFile = '/root/.openclaw/workspace/fleet-management-saas/prisma/schema.prisma';
let schema = fs.readFileSync(schemaFile, 'utf8');

// 1. Replace existing Notification model
const oldNotification = `model Notification {
  id            String              @id @default(uuid()) @db.Uuid
  companyId     String              @db.Uuid
  userId        String?             @db.Uuid
  driverId      String?             @db.Uuid
  type          NotificationType
  title         String
  message       String
  data          Json?
  isRead        Boolean             @default(false)
  readAt        DateTime?
  channel       NotificationChannel @default(IN_APP)
  sentAt        DateTime?
  deliveredAt   DateTime?
  failedAt      DateTime?
  failureReason String?
  actionUrl     String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  user    User?   @relation(fields: [userId], references: [id])
  driver  Driver? @relation(fields: [driverId], references: [id])

  @@index([companyId])
  @@index([companyId, userId])
  @@index([companyId, driverId])
  @@index([companyId, isRead])
  @@index([companyId, type])
  @@index([companyId, createdAt])
  @@index([companyId, userId, isRead])
  @@index([companyId, driverId, isRead])
  @@index([userId, isRead])
  @@index([driverId, isRead])
  @@index([createdAt])
  @@map("notifications")
}`;

const newNotification = `model Notification {
  id                String              @id @default(uuid()) @db.Uuid
  companyId         String              @db.Uuid
  company           Company             @relation(fields: [companyId], references: [id], onDelete: Cascade)
  userId            String?             @db.Uuid
  user              User?               @relation(fields: [userId], references: [id], name: "UserNotifications")
  title             String
  body              String              @db.Text
  type              NotificationType
  category          String?
  channel           NotificationChannel @default(IN_APP)
  priority          NotificationPriority @default(NORMAL)
  status            NotificationStatus   @default(PENDING)
  readAt            DateTime?
  archivedAt        DateTime?
  actionUrl         String?
  actionLabel       String?
  imageUrl          String?
  metadata          String?             @db.Text
  relatedEntityType String?
  relatedEntityId   String?             @db.Uuid
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
  templateId        String?               @db.Uuid

  @@index([companyId, status])
  @@index([companyId, userId, status])
  @@index([companyId, type])
  @@index([companyId, createdAt])
  @@index([companyId, priority])
  @@index([companyId, scheduledFor])
  @@index([companyId, deletedAt])
  @@index([userId, status])
  @@map("notifications")
}`;

schema = schema.replace(oldNotification, newNotification);

// 2. Replace existing NotificationPreference model
const oldPreference = `model NotificationPreference {
  id              String              @id @default(uuid()) @db.Uuid
  companyId       String              @db.Uuid
  userId          String              @db.Uuid
  type            NotificationType
  channel         NotificationChannel
  isEnabled       Boolean             @default(true)
  quietHoursStart Int?
  quietHoursEnd   Int?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([companyId, userId, type, channel])
  @@index([companyId])
  @@index([companyId, userId])
  @@index([companyId, userId, type])
  @@map("notification_preferences")
}`;

const newPreference = `model NotificationPreference {
  id                String              @id @default(uuid()) @db.Uuid
  companyId         String              @db.Uuid
  company           Company             @relation(fields: [companyId], references: [id], onDelete: Cascade)
  userId            String              @db.Uuid
  user              User                @relation(fields: [userId], references: [id], name: "UserNotificationPreferences", onDelete: Cascade)
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
}`;

schema = schema.replace(oldPreference, newPreference);

// 3. Add missing enums after the existing NotificationType enum
const existingEnums = `enum NotificationType {`;
const newEnums = `enum NotificationStatus {
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

enum NotificationType {`;

schema = schema.replace(existingEnums, newEnums);

// 4. Add missing models after NotificationPreference
const modelsToAdd = `

model NotificationTemplate {
  id                String              @id @default(uuid()) @db.Uuid
  companyId         String              @db.Uuid
  company           Company             @relation(fields: [companyId], references: [id], onDelete: Cascade)
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
  notification      Notification        @relation(fields: [notificationId], references: [id], onDelete: Cascade)
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
  company           Company             @relation(fields: [companyId], references: [id], onDelete: Cascade)
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
  company           Company             @relation(fields: [companyId], references: [id], onDelete: Cascade)
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
  thread            CommunicationThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
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

// Insert after NotificationPreference
const preferenceEnd = `  @@map("notification_preferences")
}`;
schema = schema.replace(preferenceEnd, preferenceEnd + modelsToAdd);

fs.writeFileSync(schemaFile, schema);
console.log('Schema updated with Phase 14 models');
