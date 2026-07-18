import { z } from 'zod';

export const telemetryPointSchema = z.object({
  vehicleId: z.string().uuid(),
  deviceId: z.string().uuid().optional(),
  tripId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  altitude: z.number().optional(),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  accuracy: z.number().optional(),
  ignition: z.boolean().optional(),
  engineStatus: z.string().optional(),
  batteryVoltage: z.number().optional(),
  fuelLevel: z.number().min(0).max(100).optional(),
  engineHours: z.number().optional(),
  odometer: z.number().optional(),
  harshBraking: z.boolean().optional(),
  harshAcceleration: z.boolean().optional(),
  sharpCornering: z.boolean().optional(),
  overspeed: z.boolean().optional(),
  idleTime: z.number().optional(),
  distance: z.number().optional(),
  temperature: z.number().optional(),
  tirePressure: z.record(z.number()).optional(),
  timestamp: z.string().datetime().optional(),
});

export const telemetryBatchSchema = z.object({
  points: z.array(telemetryPointSchema).min(1).max(500),
});

export const telemetrySearchSchema = z.object({
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(5000).default(100),
});

export type TelemetryPointInput = z.infer<typeof telemetryPointSchema>;
export type TelemetryBatchInput = z.infer<typeof telemetryBatchSchema>;
export type TelemetrySearchInput = z.infer<typeof telemetrySearchSchema>;
