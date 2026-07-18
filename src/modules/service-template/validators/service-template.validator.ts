import { z } from 'zod';
import { ServiceTemplateType } from '@prisma/client';

export const createServiceTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  templateType: z.nativeEnum(ServiceTemplateType).default(ServiceTemplateType.CUSTOM),
  estimatedDuration: z.number().int().nonnegative().optional().nullable(),
  estimatedCost: z.number().nonnegative().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateServiceTemplateSchema = createServiceTemplateSchema.partial().extend({
  name: z.string().min(1).max(200).optional(),
});

export const serviceTemplateItemSchema = z.object({
  itemName: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  estimatedTime: z.number().int().nonnegative().optional().nullable(),
  isRequired: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const serviceTemplateSearchSchema = z.object({
  q: z.string().optional(),
  templateType: z.string().optional(),
  isActive: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateServiceTemplateInput = z.infer<typeof createServiceTemplateSchema>;
export type UpdateServiceTemplateInput = z.infer<typeof updateServiceTemplateSchema>;
export type ServiceTemplateItemInput = z.infer<typeof serviceTemplateItemSchema>;
export type ServiceTemplateSearchInput = z.infer<typeof serviceTemplateSearchSchema>;
