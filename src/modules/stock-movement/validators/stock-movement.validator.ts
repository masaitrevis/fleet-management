import { z } from 'zod';
import { StockMovementType } from '@prisma/client';

export const createStockMovementSchema = z.object({
  stockId: z.string().uuid(),
  movementType: z.nativeEnum(StockMovementType),
  quantity: z.number().int(),
  unitPrice: z.number().nonnegative().optional().nullable(),
  totalPrice: z.number().nonnegative().optional().nullable(),
  referenceId: z.string().uuid().optional().nullable(),
  referenceType: z.string().optional().nullable(),
  sourceWarehouseId: z.string().uuid().optional().nullable(),
  destinationWarehouseId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const stockMovementSearchSchema = z.object({
  stockId: z.string().uuid().optional(),
  movementType: z.nativeEnum(StockMovementType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type StockMovementSearchInput = z.infer<typeof stockMovementSearchSchema>;
