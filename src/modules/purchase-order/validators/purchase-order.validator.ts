import { z } from 'zod';
import { PurchaseOrderStatus } from '@prisma/client';

export const createPurchaseOrderSchema = z.object({
  orderNumber: z.string().min(1).max(50),
  supplierId: z.string().uuid().optional().nullable(),
  status: z.nativeEnum(PurchaseOrderStatus).default(PurchaseOrderStatus.DRAFT),
  orderDate: z.string().datetime().optional().nullable(),
  deliveryDate: z.string().datetime().optional().nullable(),
  expectedDate: z.string().datetime().optional().nullable(),
  totalAmount: z.number().nonnegative().optional().nullable(),
  taxAmount: z.number().nonnegative().optional().nullable(),
  discountAmount: z.number().nonnegative().optional().nullable(),
  currency: z.string().default('KES'),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    partId: z.string().uuid().optional().nullable(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative().default(0),
    totalPrice: z.number().nonnegative().optional().nullable(),
    notes: z.string().optional().nullable(),
  })).default([]),
});

export const updatePurchaseOrderSchema = createPurchaseOrderSchema.partial();

export const purchaseOrderSearchSchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(PurchaseOrderStatus).optional(),
  supplierId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type PurchaseOrderSearchInput = z.infer<typeof purchaseOrderSearchSchema>;
