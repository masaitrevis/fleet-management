import { z } from 'zod';

export const GPSDeviceStatus = z.enum(['ACTIVE', 'INACTIVE', 'OFFLINE', 'SUSPENDED', 'DECOMMISSIONED']);

export const createGPSDeviceSchema = z.object({
  deviceId: z.string().min(1).max(100),
  serialNumber: z.string().max(100).optional(),
  imei: z.string().max(50).optional(),
  simNumber: z.string().max(50).optional(),
  simProvider: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  firmwareVersion: z.string().max(50).optional(),
  status: GPSDeviceStatus.default('ACTIVE'),
  batteryLevel: z.number().min(0).max(100).optional(),
  signalStrength: z.number().min(0).max(100).optional(),
  networkType: z.string().max(20).optional(),
});

export const updateGPSDeviceSchema = createGPSDeviceSchema.partial();

export const gpsDeviceSearchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  manufacturer: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const assignVehicleSchema = z.object({
  vehicleId: z.string().uuid(),
});

export const replaceDeviceSchema = z.object({
  newDeviceId: z.string().uuid(),
});

export type CreateGPSDeviceInput = z.infer<typeof createGPSDeviceSchema>;
export type UpdateGPSDeviceInput = z.infer<typeof updateGPSDeviceSchema>;
export type GPSDeviceSearchInput = z.infer<typeof gpsDeviceSearchSchema>;
export type AssignVehicleInput = z.infer<typeof assignVehicleSchema>;
export type ReplaceDeviceInput = z.infer<typeof replaceDeviceSchema>;
