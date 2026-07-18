import { NotificationChannel, NotificationType, NotificationPriority, DeliveryStatus } from '@prisma/client';

export interface NotificationPayload {
  companyId: string;
  userId?: string;
  title: string;
  body: string;
  type: NotificationType;
  category?: string;
  channel?: NotificationChannel;
  priority?: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  scheduledFor?: Date;
  templateId?: string;
}

export interface DeliveryResult {
  success: boolean;
  provider?: string;
  providerResponse?: string;
  errorMessage?: string;
  deliveredAt?: Date;
}

export interface NotificationProvider {
  name: string;
  channel: NotificationChannel;
  send(payload: NotificationPayload, recipient: RecipientInfo): Promise<DeliveryResult>;
  isConfigured(): boolean;
}

export interface RecipientInfo {
  email?: string;
  phone?: string;
  pushToken?: string;
  userId: string;
}
