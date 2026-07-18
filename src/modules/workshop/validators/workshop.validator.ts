import { z } from 'zod';

export const createWorkshopSchema = z.object({
  name: z.string().min(1).max(200),
  contactName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  phone2: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isInternal: z.boolean().default(false),
  rating: z.number().min(0).max(5).optional().nullable(),
  certifications: z.array(z.string()).default([]),
  specialization: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateWorkshopSchema = createWorkshopSchema.partial().extend({
  name: z.string().min(1).max(200).optional(),
});

export const workshopSearchSchema = z.object({
  q: z.string().optional(),
  isActive: z.string().optional(),
  isInternal: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateWorkshopInput = z.infer<typeof createWorkshopSchema>;
export type UpdateWorkshopInput = z.infer<typeof updateWorkshopSchema>;
export type WorkshopSearchInput = z.infer<typeof workshopSearchSchema>;
