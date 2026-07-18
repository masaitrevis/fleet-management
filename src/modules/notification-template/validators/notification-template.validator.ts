import { z } from 'zod';
import { TemplateType, NotificationType } from '@prisma/client';

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional().nullable(),
  templateType: z.nativeEnum(TemplateType),
  subject: z.string().max(200).optional().nullable(),
  body: z.string().min(1),
  variables: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  category: z.string().max(100).optional().nullable(),
  notificationType: z.nativeEnum(NotificationType).optional().nullable(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const templateSearchSchema = z.object({
  q: z.string().optional(),
  templateType: z.string().optional(),
  isActive: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();
