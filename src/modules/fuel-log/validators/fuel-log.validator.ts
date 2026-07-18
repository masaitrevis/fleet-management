import { z } from 'zod';
import { FuelType, FuelPaymentMethod, FuelLogStatus, FuelReceiptStatus } from '@prisma/client';

export const createFuelLogSchema = z.object({
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid().optional().nullable(),
  tripId: z.string().uuid().optional().nullable(),
  fuelStationId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  fuelDate: z.string().datetime(),
  fuelType: z.nativeEnum(FuelType),
  quantity: z.number().positive(),
  pricePerUnit: z.number().positive(),
  totalCost: z.number().positive(),
  currency: z.string().default('KES'),
  odometerReading: z.number().nonnegative().optional(),
  gpsLatitude: z.number().optional(),
  gpsLongitude: z.number().optional(),
  paymentMethod: z.nativeEnum(FuelPaymentMethod).default(FuelPaymentMethod.CASH),
  fuelCardId: z.string().uuid().optional().nullable(),
  receiptUrl: z.string().optional(),
  receiptStatus: z.nativeEnum(FuelReceiptStatus).default(FuelReceiptStatus.MISSING),
  status: z.nativeEnum(FuelLogStatus).default(FuelLogStatus.PENDING),
  notes: z.string().optional(),
  isManualEntry: z.boolean().default(true),
});

export const updateFuelLogSchema = createFuelLogSchema.partial().extend({
  vehicleId: z.string().uuid().optional(),
});

export const fuelLogSearchSchema = z.object({
  q: z.string().optional(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  fuelType: z.string().optional(),
  status: z.string().optional(),
  paymentMethod: z.string().optional(),
  fuelCardId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('fuelDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const bulkFuelLogSchema = z.object({
  logs: z.array(createFuelLogSchema).min(1).max(500),
});

export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>;
export type UpdateFuelLogInput = z.infer<typeof updateFuelLogSchema>;
export type FuelLogSearchInput = z.infer<typeof fuelLogSearchSchema>;
export type BulkFuelLogInput = z.infer<typeof bulkFuelLogSchema>;
