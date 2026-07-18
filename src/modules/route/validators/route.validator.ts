import { z } from 'zod';

export const RouteStopType = z.enum(['PICKUP', 'DELIVERY', 'WAYPOINT', 'REST_STOP', 'FUEL_STOP', 'MAINTENANCE', 'OTHER']);

export const routeStopInputSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  stopOrder: z.number().int().nonnegative(),
  estimatedWaitTime: z.number().int().nonnegative().optional(),
  stopType: RouteStopType.default('WAYPOINT'),
  isActive: z.boolean().default(true),
});

export const waypointInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  order: z.number().int().nonnegative(),
});

export const createRouteSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startLocation: z.string().min(1).max(300),
  endLocation: z.string().min(1).max(300),
  startLat: z.number().min(-90).max(90).optional(),
  startLng: z.number().min(-180).max(180).optional(),
  endLat: z.number().min(-90).max(90).optional(),
  endLng: z.number().min(-180).max(180).optional(),
  distance: z.number().nonnegative().optional(),
  estimatedDuration: z.number().int().nonnegative().optional(),
  isActive: z.boolean().default(true),
  isOptimized: z.boolean().default(false),
  routeStops: z.array(routeStopInputSchema).optional(),
  waypoints: z.array(waypointInputSchema).optional(),
});

export const updateRouteSchema = createRouteSchema.partial();

export const routeSearchSchema = z.object({
  q: z.string().optional(),
  isActive: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
export type RouteSearchInput = z.infer<typeof routeSearchSchema>;
export type RouteStopInput = z.infer<typeof routeStopInputSchema>;
export type WaypointInput = z.infer<typeof waypointInputSchema>;
