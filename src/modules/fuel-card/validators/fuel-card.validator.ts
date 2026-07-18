import { z } from 'zod';
import { FuelCardStatus } from '@prisma/client';

export const createFuelCardSchema = z.object({
  cardNumber: z.string().min(1),
  cardHolderName: z.string().optional(),
  assignedDriverId: z.string().uuid().optional().nullable(),
  assignedVehicleId: z.string().uuid().optional().nullable(),
  spendingLimit: z.number().nonnegative().optional(),
  dailyLimit: z.number().nonnegative().optional(),
  monthlyLimit: z.number().nonnegative().optional(),
  expiryDate: z.string().datetime().optional(),
  status: z.nativeEnum(FuelCardStatus).default(FuelCardStatus.ACTIVE),
  pinCode: z.string().optional(),
});

export const updateFuelCardSchema = createFuelCardSchema.partial();

export const fuelCardSearchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  driverId: z.string().optional(),
  vehicleId: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateFuelCardInput = z.infer<typeof createFuelCardSchema>;
export type UpdateFuelCardInput = z.infer<typeof updateFuelCardSchema>;
export type FuelCardSearchInput = z.infer<typeof fuelCardSearchSchema>;
