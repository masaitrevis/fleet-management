import { z } from 'zod';
import { PartStatus } from '@prisma/client';

export const createInventoryPartSchema = z.object({
  partNumber: z.string().min(1).max(50),
  barcode: z.string().optional().nullable(),
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  compatibleVehicles: z.any().optional(),
  unitOfMeasure: z.string().default('piece'),
  unitPrice: z.number().nonnegative().default(0),
  purchasePrice: z.number().nonnegative().default(0),
  sellingPrice: z.number().nonnegative().optional().nullable(),
  taxRate: z.number().nonnegative().default(0),
  warrantyPeriod: z.number().int().nonnegative().optional().nullable(),
  minimumStock: z.number().int().nonnegative().default(0),
  maximumStock: z.number().int().nonnegative().optional().nullable(),
  reorderLevel: z.number().int().nonnegative().default(0),
  safetyStock: z.number().int().nonnegative().default(0),
  isSerialized: z.boolean().default(false),
  isTrackable: z.boolean().default(true),
  status: z.nativeEnum(PartStatus).default(PartStatus.ACTIVE),
  imageUrl: z.string().optional().nullable(),
  datasheetUrl: z.string().optional().nullable(),
  weight: z.number().optional().nullable(),
  dimensions: z.any().optional(),
});

export const updateInventoryPartSchema = createInventoryPartSchema.partial();

export const inventoryPartSearchSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.nativeEnum(PartStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateInventoryPartInput = z.infer<typeof createInventoryPartSchema>;
export type UpdateInventoryPartInput = z.infer<typeof updateInventoryPartSchema>;
export type InventoryPartSearchInput = z.infer<typeof inventoryPartSearchSchema>;
