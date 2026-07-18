import { z } from 'zod';
import { CorrectiveActionStatus } from '@prisma/client';

export const createCorrectiveActionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  incidentId: z.string().uuid().optional().nullable(),
  vehicleId: z.string().uuid().optional().nullable(),
  driverId: z.string().uuid().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.number().int().min(1).max(10).default(1),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateCorrectiveActionSchema = createCorrectiveActionSchema.partial().extend({
  status: z.nativeEnum(CorrectiveActionStatus).optional(),
  completedAt: z.string().datetime().optional().nullable(),
  completedBy: z.string().uuid().optional().nullable(),
});

export const correctiveActionSearchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  assignedTo: z.string().optional(),
  incidentId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();
