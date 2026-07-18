import { z } from 'zod';

export const createStockSchema = z.object({
  partId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().int().nonnegative().default(0),
  reservedQuantity: z.number().int().nonnegative().default(0),
  availableQuantity: z.number().int().nonnegative().default(0),
  reorderLevel: z.number().int().nonnegative().default(0),
});

export const updateStockSchema = createStockSchema.partial().omit({ partId: true, warehouseId: true });

export const stockSearchSchema = z.object({
  partId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  lowStock: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateStockInput = z.infer<typeof createStockSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type StockSearchInput = z.infer<typeof stockSearchSchema>;
