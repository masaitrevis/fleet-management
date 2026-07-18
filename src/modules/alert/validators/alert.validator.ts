import { z } from 'zod';

export const AlertType = z.enum([
  'OVERSPEED', 'OFFLINE', 'LOW_BATTERY', 'IDLE', 'UNAUTHORIZED_MOVEMENT',
  'ROUTE_DEVIATION', 'EMERGENCY_SOS', 'GEOFENCE_ENTER', 'GEOFENCE_EXIT',
]);
export const AlertSeverity = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const AlertStatus = z.enum(['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED']);

export const createAlertSchema = z.object({
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid().optional(),
  alertType: AlertType,
  severity: AlertSeverity.default('MEDIUM'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  speed: z.number().optional(),
  value: z.string().optional(),
  message: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const alertSearchSchema = z.object({
  q: z.string().optional(),
  alertType: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  vehicleId: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const resolveAlertSchema = z.object({
  resolutionNotes: z.string().optional(),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type AlertSearchInput = z.infer<typeof alertSearchSchema>;
export type ResolveAlertInput = z.infer<typeof resolveAlertSchema>;
