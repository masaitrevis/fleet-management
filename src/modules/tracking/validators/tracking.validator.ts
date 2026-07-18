import { z } from 'zod';

export const locationUpdateSchema = z.object({
  vehicleId: z.string().uuid(),
  deviceId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().optional(),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  accuracy: z.number().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  ignition: z.boolean().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  street: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

export const locationSearchSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(5000).default(100),
});

export const boundsSchema = z.object({
  north: z.number(),
  south: z.number(),
  east: z.number(),
  west: z.number(),
});

export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
export type LocationSearchInput = z.infer<typeof locationSearchSchema>;
export type BoundsInput = z.infer<typeof boundsSchema>;
