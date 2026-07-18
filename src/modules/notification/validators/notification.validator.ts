import { z } from 'zod';
import { NotificationChannel, NotificationType, NotificationPriority, NotificationStatus } from '@prisma/client';

export const createNotificationSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  type: z.nativeEnum(NotificationType).default('CUSTOM'),
  category: z.string().max(100).optional().nullable(),
  channel: z.nativeEnum(NotificationChannel).default('IN_APP'),
  priority: z.nativeEnum(NotificationPriority).default('NORMAL'),
  actionUrl: z.string().url().optional().nullable(),
  actionLabel: z.string().max(100).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  metadata: z.string().optional().nullable(),
  relatedEntityType: z.string().max(100).optional().nullable(),
  relatedEntityId: z.string().uuid().optional().nullable(),
  scheduledFor: z.string().datetime().optional().nullable(),
});

export const notificationSearchSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  channel: z.string().optional(),
  userId: z.string().optional(),
  unread: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();

export const markReadSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  all: z.boolean().optional(),
});
