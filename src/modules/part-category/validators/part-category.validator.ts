import { z } from 'zod';

export const createPartCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updatePartCategorySchema = createPartCategorySchema.partial();

export const partCategorySearchSchema = z.object({
  q: z.string().optional(),
  parentId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreatePartCategoryInput = z.infer<typeof createPartCategorySchema>;
export type UpdatePartCategoryInput = z.infer<typeof updatePartCategorySchema>;
export type PartCategorySearchInput = z.infer<typeof partCategorySearchSchema>;
