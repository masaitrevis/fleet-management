import { z } from 'zod';
import { ComplianceRuleType, ComplianceRuleStatus } from '@prisma/client';

export const createComplianceRuleSchema = z.object({
  ruleType: z.nativeEnum(ComplianceRuleType),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  appliesTo: z.enum(['VEHICLE', 'DRIVER', 'BOTH']),
  documentType: z.string().optional().nullable(),
  inspectionType: z.string().optional().nullable(),
  gracePeriodDays: z.number().int().min(0).default(0),
  isMandatory: z.boolean().default(true),
  isBlocking: z.boolean().default(true),
  autoRenewal: z.boolean().default(false),
  reminderDays: z.array(z.number().int()).default([30, 7, 1]),
  status: z.nativeEnum(ComplianceRuleStatus).default('ACTIVE'),
  priority: z.number().int().min(1).max(10).default(1),
  customLogic: z.string().optional().nullable(),
  failureAction: z.enum(['BLOCK', 'WARN', 'NOTIFY']).optional().nullable(),
});

export const updateComplianceRuleSchema = createComplianceRuleSchema.partial();

export const complianceRuleSearchSchema = z.object({
  q: z.string().optional(),
  ruleType: z.string().optional(),
  status: z.string().optional(),
  appliesTo: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();
