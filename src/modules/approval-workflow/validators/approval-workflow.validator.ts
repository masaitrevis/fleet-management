import { z } from 'zod';

export const approvalStepSchema = z.object({
  stepNumber: z.number().int().min(1),
  name: z.string().min(1).max(200),
  approverId: z.string().uuid().optional().nullable(),
  approverRoleId: z.string().uuid().optional().nullable(),
  requiresAll: z.boolean().default(false),
});

export const createApprovalWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  workflowType: z.enum(['DOCUMENT', 'INSPECTION', 'CORRECTIVE_ACTION', 'EXCEPTION']),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  steps: z.array(approvalStepSchema).optional(),
});

export const updateApprovalWorkflowSchema = createApprovalWorkflowSchema.partial();

export const approvalWorkflowSearchSchema = z.object({
  q: z.string().optional(),
  workflowType: z.string().optional(),
  isActive: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();

export const createApprovalRequestSchema = z.object({
  workflowId: z.string().uuid(),
  entityType: z.enum(['DOCUMENT', 'INSPECTION', 'CORRECTIVE_ACTION', 'EXCEPTION']),
  entityId: z.string().uuid(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateApprovalRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
  decisionNotes: z.string().max(2000).optional().nullable(),
});
