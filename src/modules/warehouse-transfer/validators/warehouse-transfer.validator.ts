import { z } from 'zod';
import { WarehouseTransferStatus } from '@prisma/client';

export const createWarehouseTransferSchema = z.object({
  transferNumber: z.string().min(1).max(50),
  sourceWarehouseId: z.string().uuid(),
  destinationWarehouseId: z.string().uuid(),
  status: z.nativeEnum(WarehouseTransferStatus).default(WarehouseTransferStatus.DRAFT),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    partId: z.string().uuid().optional().nullable(),
    quantity: z.number().int().positive(),
    notes: z.string().optional().nullable(),
  })).default([]),
});

export const updateWarehouseTransferSchema = createWarehouseTransferSchema.partial();

export const warehouseTransferSearchSchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(WarehouseTransferStatus).optional(),
  sourceWarehouseId: z.string().uuid().optional(),
  destinationWarehouseId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateWarehouseTransferInput = z.infer<typeof createWarehouseTransferSchema>;
export type UpdateWarehouseTransferInput = z.infer<typeof updateWarehouseTransferSchema>;
export type WarehouseTransferSearchInput = z.infer<typeof warehouseTransferSearchSchema>;
