import { z } from 'zod';

export const createInvitationSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  roleIds: z.array(z.string().uuid()).min(1),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  employeeId: z.string().max(50).optional(),
  jobTitle: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
  phone: z.string().min(5).max(20).optional(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
