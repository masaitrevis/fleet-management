import { z } from 'zod';

export const behaviorPeriodSchema = z.object({
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
});

export const createBehaviorSchema = z.object({
  driverId: z.string().uuid(),
  vehicleId: z.string().uuid().optional(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  totalTrips: z.number().int().default(0),
  totalDistance: z.number().optional(),
  totalDuration: z.number().optional(),
  totalIdleTime: z.number().optional(),
  safetyScore: z.number().min(0).max(100).optional(),
  aggressiveScore: z.number().min(0).max(100).optional(),
  efficiencyScore: z.number().min(0).max(100).optional(),
  speedingEvents: z.number().int().default(0),
  harshBrakingEvents: z.number().int().default(0),
  harshAccelerationEvents: z.number().int().default(0),
  corneringEvents: z.number().int().default(0),
  overspeedEvents: z.number().int().default(0),
  longIdleEvents: z.number().int().default(0),
  avgSpeed: z.number().optional(),
  maxSpeed: z.number().optional(),
});

export type BehaviorPeriodInput = z.infer<typeof behaviorPeriodSchema>;
export type CreateBehaviorInput = z.infer<typeof createBehaviorSchema>;
