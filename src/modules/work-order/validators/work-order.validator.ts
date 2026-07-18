import { z } from 'zod';
import { MaintenanceJobType, MaintenancePriority, WorkOrderStatus } from '@prisma/client';

export const createWorkOrderSchema = z.object({
  workOrderNumber: z.string().min(1).max(50),
  vehicleId: z.string().uuid(),
  scheduleId: z.string().uuid().optional().nullable(),
  serviceTemplateId: z.string().uuid().optional().nullable(),
  mechanicId: z.string().uuid().optional().nullable(),
  supervisorId: z.string().uuid().optional().nullable(),
  serviceCenterId: z.string().uuid().optional().nullable(),
  jobType: z.nativeEnum(MaintenanceJobType).default(MaintenanceJobType.PREVENTIVE),
  priority: z.nativeEnum(MaintenancePriority).default(MaintenancePriority.NORMAL),
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  scheduledDate: z.string().datetime().optional().nullable(),
  estimatedCost: z.number().nonnegative().optional().nullable(),
  estimatedDuration: z.number().int().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  beforePhotos: z.array(z.string()).default([]),
});

export const updateWorkOrderSchema = createWorkOrderSchema.partial().extend({
  workOrderNumber: z.string().min(1).max(50).optional(),
  vehicleId: z.string().uuid().optional(),
  title: z.string().min(1).max(200).optional(),
});

export const workOrderSearchSchema = z.object({
  q: z.string().optional(),
  vehicleId: z.string().optional(),
  mechanicId: z.string().optional(),
  status: z.string().optional(),
  jobType: z.string().optional(),
  priority: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const assignWorkOrderSchema = z.object({
  mechanicId: z.string().uuid(),
});

export const approveWorkOrderSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});

export const updateWorkOrderStatusSchema = z.object({
  status: z.nativeEnum(WorkOrderStatus),
  notes: z.string().optional(),
  actualCost: z.number().nonnegative().optional().nullable(),
  actualDuration: z.number().int().nonnegative().optional().nullable(),
  afterPhotos: z.array(z.string()).optional(),
  inspectionPassed: z.boolean().optional(),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
export type WorkOrderSearchInput = z.infer<typeof workOrderSearchSchema>;
export type AssignWorkOrderInput = z.infer<typeof assignWorkOrderSchema>;
export type ApproveWorkOrderInput = z.infer<typeof approveWorkOrderSchema>;
export type UpdateWorkOrderStatusInput = z.infer<typeof updateWorkOrderStatusSchema>;
