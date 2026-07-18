import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).min(1),
  isSystem: z.boolean().default(false),
});

export const updateRoleSchema = createRoleSchema.partial();

export const cloneRoleSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CloneRoleInput = z.infer<typeof cloneRoleSchema>;
