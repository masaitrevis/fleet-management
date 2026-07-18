import { z } from 'zod';

export const TripStatus = z.enum(['PLANNED', 'SCHEDULED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED', 'NO_SHOW']);
export const TripStopStatus = z.enum(['PENDING', 'ARRIVED', 'DEPARTED', 'SKIPPED', 'DELAYED', 'CANCELLED']);
export const TripPriority = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);
export const RouteStopType = z.enum(['PICKUP', 'DELIVERY', 'WAYPOINT', 'REST_STOP', 'FUEL_STOP', 'MAINTENANCE', 'OTHER']);
export const InspectionType = z.enum(['PRE_TRIP', 'POST_TRIP']);

export const tripStopInputSchema = z.object({
  routeStopId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  scheduledArrival: z.string().datetime().optional(),
  status: TripStopStatus.default('PENDING'),
  notes: z.string().max(2000).optional(),
  stopOrder: z.number().int().nonnegative().default(0),
});

export const tripCargoInputSchema = z.object({
  cargoType: z.string().min(1).max(100),
  weight: z.number().nonnegative().optional(),
  volume: z.number().nonnegative().optional(),
  quantity: z.number().int().nonnegative().optional(),
  isDangerousGoods: z.boolean().default(false),
  temperatureRequired: z.string().max(100).optional(),
  customerReference: z.string().max(200).optional(),
  deliveryInstructions: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

export const tripChecklistInputSchema = z.object({
  item: z.string().min(1).max(300),
  isRequired: z.boolean().default(true),
  isCompleted: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
});

export const tripTimelineInputSchema = z.object({
  eventType: z.string().min(1).max(50),
  eventTime: z.string().datetime().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().max(2000).optional(),
});

export const tripInspectionInputSchema = z.object({
  type: InspectionType,
  odometer: z.number().nonnegative().optional(),
  fuelLevel: z.number().min(0).max(100).optional(),
  photos: z.array(z.string().url()).optional(),
  damageReport: z.string().max(2000).optional(),
  comments: z.string().max(2000).optional(),
  signature: z.string().optional(),
});

export const createTripSchema = z.object({
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  routeId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startTime: z.string().datetime().optional(),
  estimatedEndTime: z.string().datetime().optional(),
  estimatedDistance: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
  priority: TripPriority.default('NORMAL'),
  tripStops: z.array(tripStopInputSchema).optional(),
  tripCargos: z.array(tripCargoInputSchema).optional(),
  tripChecklists: z.array(tripChecklistInputSchema).optional(),
});

export const updateTripSchema = createTripSchema.partial();

export const tripSearchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  priority: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const startTripSchema = z.object({
  startOdometer: z.number().nonnegative().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().max(2000).optional(),
});

export const pauseTripSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().max(2000).optional(),
});

export const resumeTripSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().max(2000).optional(),
});

export const completeTripSchema = z.object({
  endOdometer: z.number().nonnegative().optional(),
  distance: z.number().nonnegative().optional(),
  fuelCost: z.number().nonnegative().optional(),
  totalCost: z.number().nonnegative().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().max(2000).optional(),
});

export const cancelTripSchema = z.object({
  cancellationReason: z.string().min(1).max(1000),
  notes: z.string().max(2000).optional(),
});

export const updateTripStopSchema = z.object({
  status: TripStopStatus,
  actualArrival: z.string().datetime().optional(),
  actualDeparture: z.string().datetime().optional(),
  waitDuration: z.number().int().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateTripChecklistSchema = z.object({
  id: z.string().uuid(),
  isCompleted: z.boolean(),
  notes: z.string().max(1000).optional(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type TripSearchInput = z.infer<typeof tripSearchSchema>;
export type StartTripInput = z.infer<typeof startTripSchema>;
export type PauseTripInput = z.infer<typeof pauseTripSchema>;
export type ResumeTripInput = z.infer<typeof resumeTripSchema>;
export type CompleteTripInput = z.infer<typeof completeTripSchema>;
export type CancelTripInput = z.infer<typeof cancelTripSchema>;
export type UpdateTripStopInput = z.infer<typeof updateTripStopSchema>;
export type UpdateTripChecklistInput = z.infer<typeof updateTripChecklistSchema>;
export type TripInspectionInput = z.infer<typeof tripInspectionInputSchema>;
export type TripTimelineInput = z.infer<typeof tripTimelineInputSchema>;
export type TripStopInput = z.infer<typeof tripStopInputSchema>;
export type TripCargoInput = z.infer<typeof tripCargoInputSchema>;
export type TripChecklistInput = z.infer<typeof tripChecklistInputSchema>;
