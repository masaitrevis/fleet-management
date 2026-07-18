import { z } from 'zod';

export const FuelFraudStatus = z.enum(['OPEN', 'INVESTIGATING', 'CONFIRMED', 'FALSE_POSITIVE', 'DISMISSED']);

export const updateFraudStatusSchema = z.object({
  status: FuelFraudStatus,
  description: z.string().max(2000).optional(),
});

export const fuelFraudSearchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  fraudType: z.string().optional(),
  vehicleId: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('detectedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type UpdateFraudStatusInput = z.infer<typeof updateFraudStatusSchema>;
export type FuelFraudSearchInput = z.infer<typeof fuelFraudSearchSchema>;
