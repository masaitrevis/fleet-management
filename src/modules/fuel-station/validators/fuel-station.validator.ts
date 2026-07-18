import { z } from 'zod';
import { FuelStationStatus } from '@prisma/client';

export const createFuelStationSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().nullable(),
  isGlobal: z.boolean().default(false),
  status: z.nativeEnum(FuelStationStatus).default(FuelStationStatus.ACTIVE),
});

export const updateFuelStationSchema = createFuelStationSchema.partial();

export const fuelStationSearchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateFuelStationInput = z.infer<typeof createFuelStationSchema>;
export type UpdateFuelStationInput = z.infer<typeof updateFuelStationSchema>;
export type FuelStationSearchInput = z.infer<typeof fuelStationSearchSchema>;
