import { z } from 'zod';
import { InspectionType } from '@prisma/client';

export const inspectionTemplateItemSchema = z.object({
  itemNumber: z.number().int().min(1),
  label: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  isCritical: z.boolean().default(false),
  requiresPhoto: z.boolean().default(false),
  requiresNotes: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const createInspectionTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  inspectionType: z.nativeEnum(InspectionType),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  items: z.array(inspectionTemplateItemSchema).optional(),
});

export const updateInspectionTemplateSchema = createInspectionTemplateSchema.partial();

export const inspectionTemplateSearchSchema = z.object({
  q: z.string().optional(),
  inspectionType: z.string().optional(),
  isActive: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();
