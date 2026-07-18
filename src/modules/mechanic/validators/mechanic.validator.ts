import { z } from 'zod';
import { MechanicStatus } from '@prisma/client';

export const createMechanicSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  employeeId: z.string().optional().nullable(),
  hireDate: z.string().datetime().optional().nullable(),
  status: z.nativeEnum(MechanicStatus).default(MechanicStatus.ACTIVE),
  skills: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  hourlyRate: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
});

export const updateMechanicSchema = createMechanicSchema.partial().extend({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
});

export const mechanicSearchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  skill: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateMechanicInput = z.infer<typeof createMechanicSchema>;
export type UpdateMechanicInput = z.infer<typeof updateMechanicSchema>;
export type MechanicSearchInput = z.infer<typeof mechanicSearchSchema>;
