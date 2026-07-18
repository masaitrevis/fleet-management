import { z } from 'zod';
import { PlatformUserRole, PlatformUserStatus } from '../types';

export const CreatePlatformUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['SUPER_ADMIN', 'SUPPORT', 'SALES', 'FINANCE', 'ENGINEER']),
  phone: z.string().optional(),
  locale: z.string().default('en'),
  timezone: z.string().default('Africa/Nairobi'),
});

export const UpdatePlatformUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['SUPER_ADMIN', 'SUPPORT', 'SALES', 'FINANCE', 'ENGINEER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']).optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
});

export const CreateFeatureFlagSchema = z.object({
  companyId: z.string().uuid(),
  featureKey: z.string().min(1),
  isEnabled: z.boolean().default(false),
  config: z.record(z.any()).optional(),
});

export const UpdateFeatureFlagSchema = z.object({
  isEnabled: z.boolean().optional(),
  config: z.record(z.any()).optional(),
});

export const UpdateSystemConfigSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  category: z.string().default('general'),
  description: z.string().optional(),
  isEncrypted: z.boolean().default(false),
});

export const TenantSearchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'TRIAL']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const BlockIPSchema = z.object({
  ipAddress: z.string().min(1),
  reason: z.string().optional(),
});

export const ResolveSecurityEventSchema = z.object({
  resolvedBy: z.string().uuid(),
});
