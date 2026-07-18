import { z } from 'zod';

export const companySettingsSchema = z.object({
  timezone: z.string().default('UTC'),
  language: z.string().default('en'),
  currency: z.string().default('USD'),
  dateFormat: z.string().default('YYYY-MM-DD'),
  timeFormat: z.string().default('24h'),
  measurementUnit: z.enum(['metric', 'imperial']).default('metric'),
  fuelUnit: z.enum(['liters', 'gallons']).default('liters'),
  distanceUnit: z.enum(['km', 'miles']).default('km'),
});

export const createCompanySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  phone: z.string().min(5).max(20).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  website: z.string().url().optional(),
  taxId: z.string().max(50).optional(),
  registrationNumber: z.string().max(50).optional(),
  industry: z.string().max(100).optional(),
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  logo: z.string().optional(),
  branding: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    logoUrl: z.string().optional(),
  }).optional(),
});

export const companyStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL', 'PENDING']),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
