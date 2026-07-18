import { z } from 'zod';

export const AssignmentType = z.enum(['PRIMARY', 'TEMPORARY', 'SUBSTITUTE', 'TRAINING']);

export const createAssignmentSchema = z.object({
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  assignmentType: AssignmentType.default('PRIMARY'),
  notes: z.string().max(1000).optional(),
  isPrimary: z.boolean().default(true),
});

export const updateAssignmentSchema = z.object({
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  assignmentType: AssignmentType.optional(),
  notes: z.string().max(1000).optional(),
  isPrimary: z.boolean().optional(),
});

export const assignmentSearchSchema = z.object({
  q: z.string().optional(),
  assignmentType: z.string().optional(),
  branchId: z.string().optional(),
  departmentId: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('assignedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const swapDriverSchema = z.object({
  assignmentId: z.string().uuid(),
  newDriverId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

export const swapVehicleSchema = z.object({
  assignmentId: z.string().uuid(),
  newVehicleId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

export const transferAssignmentSchema = z.object({
  assignmentId: z.string().uuid(),
  newDriverId: z.string().uuid().optional(),
  newVehicleId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
}).refine((data) => data.newDriverId || data.newVehicleId || data.branchId || data.departmentId, {
  message: 'At least one field must change (newDriverId, newVehicleId, branchId, or departmentId)',
});

export const historyQuerySchema = z.object({
  driverId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
});

export type CreateAssignmentInput = {
  vehicleId: string;
  driverId: string;
  branchId?: string;
  departmentId?: string;
  assignmentType?: 'PRIMARY' | 'TEMPORARY' | 'SUBSTITUTE' | 'TRAINING';
  notes?: string;
  isPrimary?: boolean;
};

export type UpdateAssignmentInput = {
  branchId?: string;
  departmentId?: string;
  assignmentType?: 'PRIMARY' | 'TEMPORARY' | 'SUBSTITUTE' | 'TRAINING';
  notes?: string;
  isPrimary?: boolean;
};

export type AssignmentSearchInput = {
  q?: string;
  assignmentType?: string;
  branchId?: string;
  departmentId?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

export type SwapDriverInput = {
  assignmentId: string;
  newDriverId: string;
  notes?: string;
};

export type SwapVehicleInput = {
  assignmentId: string;
  newVehicleId: string;
  notes?: string;
};

export type TransferAssignmentInput = {
  assignmentId: string;
  newDriverId?: string;
  newVehicleId?: string;
  branchId?: string;
  departmentId?: string;
  notes?: string;
};

export type HistoryQueryInput = {
  driverId?: string;
  vehicleId?: string;
  page: number;
  limit: number;
};
