import { z } from 'zod';
import { NotificationChannel, NotificationPriority } from '@prisma/client';

export const createQueueItemSchema = z.object({
  notificationId: z.string().uuid(),
  channel: z.nativeEnum(NotificationChannel),
  priority: z.nativeEnum(NotificationPriority).default('NORMAL'),
  scheduledFor: z.string().datetime().optional().nullable(),
});

export const queueSearchSchema = z.object({
  status: z.string().optional(),
  channel: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();
