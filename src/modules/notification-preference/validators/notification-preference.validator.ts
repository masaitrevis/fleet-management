import { z } from 'zod';
import { NotificationType, NotificationChannel, DigestFrequency } from '@prisma/client';

export const createPreferenceSchema = z.object({
  notificationType: z.nativeEnum(NotificationType),
  channels: z.array(z.nativeEnum(NotificationChannel)).default(['IN_APP']),
  enabled: z.boolean().default(true),
  quietHoursStart: z.string().regex(/^([01]?d|2[0-3]):[0-5]d$/).optional().nullable(),
  quietHoursEnd: z.string().regex(/^([01]?d|2[0-3]):[0-5]d$/).optional().nullable(),
  digestFrequency: z.nativeEnum(DigestFrequency).default('IMMEDIATE'),
  language: z.string().max(10).default('en'),
  timezone: z.string().max(50).default('UTC'),
});

export const updatePreferenceSchema = createPreferenceSchema.partial();

export const preferenceSearchSchema = z.object({
  notificationType: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();
