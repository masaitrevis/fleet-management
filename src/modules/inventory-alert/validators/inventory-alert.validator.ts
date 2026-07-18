import { z } from 'zod';

export const createInventoryAlertSchema = z.object({
  alertType: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  partId: z.string().uuid().optional().nullable(),
  warehouseId: z.string().uuid().optional().nullable(),
  purchaseOrderId: z.string().uuid().optional().nullable(),
});

export const inventoryAlertSearchSchema = z.object({
  alertType: z.string().optional(),
  isRead: z.coerce.boolean().optional(),
  isResolved: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateInventoryAlertInput = z.infer<typeof createInventoryAlertSchema>;
export type InventoryAlertSearchInput = z.infer<typeof inventoryAlertSearchSchema>;
