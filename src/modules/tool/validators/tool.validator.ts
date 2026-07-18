import { z } from 'zod';
import { ToolStatus, ToolCondition } from '@prisma/client';

export const createToolSchema = z.object({
  toolNumber: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  purchaseDate: z.string().datetime().optional().nullable(),
  purchasePrice: z.number().nonnegative().optional().nullable(),
  assignedMechanicId: z.string().uuid().optional().nullable(),
  lastCalibrationDate: z.string().datetime().optional().nullable(),
  nextCalibrationDate: z.string().datetime().optional().nullable(),
  status: z.nativeEnum(ToolStatus).default(ToolStatus.AVAILABLE),
  condition: z.nativeEnum(ToolCondition).default(ToolCondition.EXCELLENT),
  location: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateToolSchema = createToolSchema.partial();

export const toolSearchSchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(ToolStatus).optional(),
  mechanicId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateToolInput = z.infer<typeof createToolSchema>;
export type UpdateToolInput = z.infer<typeof updateToolSchema>;
export type ToolSearchInput = z.infer<typeof toolSearchSchema>;
