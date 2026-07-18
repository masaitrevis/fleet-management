import { z } from 'zod';
import { MaintenanceScheduleType } from '@prisma/client';

export const createMaintenanceScheduleSchema = z.object({
  vehicleId: z.string().uuid(),
  name: z.string().min(1).max(200),
  scheduleType: z.nativeEnum(MaintenanceScheduleType).default(MaintenanceScheduleType.TIME_BASED),
  intervalMonths: z.number().int().positive().optional().nullable(),
  intervalMileage: z.number().positive().optional().nullable(),
  intervalHours: z.number().positive().optional().nullable(),
  lastServiceDate: z.string().datetime().optional().nullable(),
  lastServiceOdometer: z.number().nonnegative().optional().nullable(),
  nextDueDate: z.string().datetime().optional().nullable(),
  nextDueOdometer: z.number().nonnegative().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  reminderDays: z.number().int().nonnegative().default(7),
  reminderOdometer: z.number().nonnegative().optional().nullable(),
});

export const updateMaintenanceScheduleSchema = createMaintenanceScheduleSchema.partial().extend({
  vehicleId: z.string().uuid().optional(),
  name: z.string().min(1).max(200).optional(),
});

export const maintenanceScheduleSearchSchema = z.object({
  q: z.string().optional(),
  vehicleId: z.string().optional(),
  scheduleType: z.string().optional(),
  isActive: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('nextDueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateMaintenanceScheduleInput = z.infer<typeof createMaintenanceScheduleSchema>;
export type UpdateMaintenanceScheduleInput = z.infer<typeof updateMaintenanceScheduleSchema>;
export type MaintenanceScheduleSearchInput = z.infer<typeof maintenanceScheduleSearchSchema>;
