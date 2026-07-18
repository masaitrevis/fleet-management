import { z } from 'zod';

export const GeofenceType = z.enum(['CIRCLE', 'POLYGON', 'POLYLINE']);
export const GeofenceAlertType = z.enum(['ENTER', 'EXIT', 'BOTH', 'DWELL', 'SPEED']);

export const createGeofenceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: GeofenceType.default('CIRCLE'),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
  radius: z.number().optional(),
  isActive: z.boolean().default(true),
  alertType: GeofenceAlertType.default('BOTH'),
  speedLimit: z.number().optional(),
  vehicles: z.array(z.string().uuid()).optional(),
});

export const updateGeofenceSchema = createGeofenceSchema.partial();

export const geofenceSearchSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  isActive: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const checkPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type CreateGeofenceInput = z.infer<typeof createGeofenceSchema>;
export type UpdateGeofenceInput = z.infer<typeof updateGeofenceSchema>;
export type GeofenceSearchInput = z.infer<typeof geofenceSearchSchema>;
export type CheckPointInput = z.infer<typeof checkPointSchema>;
