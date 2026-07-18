import { z } from 'zod';
import { SupplierStatus } from '@prisma/client';

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  contactName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  phone2: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  isPreferred: z.boolean().default(false),
  isActive: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const supplierSearchSchema = z.object({
  q: z.string().optional(),
  isPreferred: z.coerce.boolean().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type SupplierSearchInput = z.infer<typeof supplierSearchSchema>;
