import { z } from 'zod';
import { FuelSupplierStatus } from '@prisma/client';

export const createFuelSupplierSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional(),
  address: z.string().optional(),
  contractNumber: z.string().optional(),
  paymentTerms: z.string().optional(),
  taxNumber: z.string().optional(),
  status: z.nativeEnum(FuelSupplierStatus).default(FuelSupplierStatus.ACTIVE),
});

export const updateFuelSupplierSchema = createFuelSupplierSchema.partial();

export const fuelSupplierSearchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateFuelSupplierInput = z.infer<typeof createFuelSupplierSchema>;
export type UpdateFuelSupplierInput = z.infer<typeof updateFuelSupplierSchema>;
export type FuelSupplierSearchInput = z.infer<typeof fuelSupplierSearchSchema>;
