import { z } from 'zod';
import { DowntimeReason } from '@prisma/client';

export const createVehicleDowntimeSchema = z.object({
  vehicleId: z.string().uuid(),
  workOrderId: z.string().uuid().optional().nullable(),
  reason: z.nativeEnum(DowntimeReason).default(DowntimeReason.SCHEDULED_MAINTENANCE),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  description: z.string().optional().nullable(),
  impactNotes: z.string().optional().nullable(),
});

export const updateVehicleDowntimeSchema = createVehicleDowntimeSchema.partial().extend({
  vehicleId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
});

export const vehicleDowntimeSearchSchema = z.object({
  q: z.string().optional(),
  vehicleId: z.string().optional(),
  reason: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateVehicleDowntimeInput = z.infer<typeof createVehicleDowntimeSchema>;
export type UpdateVehicleDowntimeInput = z.infer<typeof updateVehicleDowntimeSchema>;
export type VehicleDowntimeSearchInput = z.infer<typeof vehicleDowntimeSearchSchema>;
