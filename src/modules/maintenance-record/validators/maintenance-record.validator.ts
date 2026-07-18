import { z } from 'zod';
import { MaintenanceStatus, MaintenancePriority, CostType } from '@prisma/client';

export const createMaintenanceRecordSchema = z.object({
  vehicleId: z.string().uuid(),
  scheduleId: z.string().uuid().optional().nullable(),
  serviceCenterId: z.string().uuid().optional().nullable(),
  mechanicId: z.string().uuid().optional().nullable(),
  serviceNumber: z.string().optional().nullable(),
  serviceDate: z.string().datetime(),
  completionDate: z.string().datetime().optional().nullable(),
  status: z.nativeEnum(MaintenanceStatus).default(MaintenanceStatus.SCHEDULED),
  priority: z.nativeEnum(MaintenancePriority).default(MaintenancePriority.NORMAL),
  odometerReading: z.number().nonnegative().optional().nullable(),
  laborCost: z.number().nonnegative().optional().nullable(),
  partsCost: z.number().nonnegative().optional().nullable(),
  totalCost: z.number().nonnegative().optional().nullable(),
  taxAmount: z.number().nonnegative().optional().nullable(),
  currency: z.string().default('KES'),
  description: z.string().optional().nullable(),
  workPerformed: z.string().optional().nullable(),
  recommendations: z.string().optional().nullable(),
  technicianName: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  warrantyMonths: z.number().int().nonnegative().optional().nullable(),
  warrantyExpiry: z.string().datetime().optional().nullable(),
  isWarrantyValid: z.boolean().default(false),
  beforeCondition: z.string().optional().nullable(),
  afterCondition: z.string().optional().nullable(),
  qualityCheckPassed: z.boolean().optional().nullable(),
  qualityCheckNotes: z.string().optional().nullable(),
});

export const updateMaintenanceRecordSchema = createMaintenanceRecordSchema.partial().extend({
  vehicleId: z.string().uuid().optional(),
  serviceDate: z.string().datetime().optional(),
});

export const maintenanceRecordSearchSchema = z.object({
  q: z.string().optional(),
  vehicleId: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  serviceCenterId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('serviceDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const maintenanceCostSchema = z.object({
  costType: z.nativeEnum(CostType),
  amount: z.number().positive(),
  description: z.string().optional().nullable(),
});

export type CreateMaintenanceRecordInput = z.infer<typeof createMaintenanceRecordSchema>;
export type UpdateMaintenanceRecordInput = z.infer<typeof updateMaintenanceRecordSchema>;
export type MaintenanceRecordSearchInput = z.infer<typeof maintenanceRecordSearchSchema>;
export type MaintenanceCostInput = z.infer<typeof maintenanceCostSchema>;
