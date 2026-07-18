import { z } from 'zod';
import { passwordSchema } from '@/modules/auth/validators/auth.validator';

export const createUserSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().min(5).max(20).optional(),
  password: passwordSchema.optional(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  roleIds: z.array(z.string().uuid()).min(1),
  employeeId: z.string().max(50).optional(),
  jobTitle: z.string().max(100).optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().min(5).max(20).optional(),
  branchId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  roleIds: z.array(z.string().uuid()).optional(),
  employeeId: z.string().max(50).optional().nullable(),
  jobTitle: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const inviteUserSchema = z.object({
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

export const assignRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()).min(1),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
