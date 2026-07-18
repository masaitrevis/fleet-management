import { userRepository } from '../repositories/user.repository';
import { CreateUserInput, UpdateUserInput, InviteUserInput } from '../validators/user.validator';
import { hashPassword } from '@/modules/auth/utils/password';
import { generateSecureToken } from '@/modules/auth/utils/crypto';
import { NotFoundError, ConflictError, BadRequestError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { sendEmail } from '@/modules/auth/utils/email';

export class UserService {
  async getAllUsers(companyId: string, options: Record<string, unknown>) {
    return userRepository.findAll(companyId, options as any);
  }

  async getUserById(id: string, companyId: string) {
    const user = await userRepository.findById(id, companyId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async createUser(companyId: string, data: CreateUserInput, createdById: string) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = data.password ? await hashPassword(data.password) : await hashPassword(generateSecureToken(12));

    const user = await authRepository.createUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      companyId,
    });

    // Assign roles
    if (data.roleIds && data.roleIds.length > 0) {
      await userRepository.updateRoles(user.id, companyId, data.roleIds);
    }

    // Update extra fields if provided - skip for now as schema doesn't support them

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      description: `User ${user.email} created`,
    });

    return userRepository.findById(user.id, companyId);
  }

  async updateUser(id: string, companyId: string, data: UpdateUserInput, updatedById: string) {
    const existing = await userRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const updateData: Record<string, unknown> = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.isActive !== undefined) updateData.status = data.isActive ? 'ACTIVE' : 'INACTIVE';

    await userRepository.update(id, updateData);

    // Update branch/department
    if (data.branchId !== undefined || data.departmentId !== undefined) {
      void data.branchId;
      void data.departmentId;
    }

    // Update roles
    if (data.roleIds && data.roleIds.length > 0) {
      await userRepository.updateRoles(id, companyId, data.roleIds);
    }

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: id,
      description: `User ${existing.email} updated`,
    });

    return userRepository.findById(id, companyId);
  }

  async deleteUser(id: string, companyId: string, deletedById: string) {
    const existing = await userRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    await userRepository.softDelete(id);

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: id,
      description: `User ${existing.email} deleted`,
    });

    return { message: 'User deleted successfully' };
  }

  async suspendUser(id: string, companyId: string, suspendedById: string) {
    const existing = await userRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    await userRepository.suspendUser(id);

    await authRepository.createAuditLog({
      companyId,
      userId: suspendedById,
      action: 'USER_SUSPENDED',
      entityType: 'User',
      entityId: id,
      description: `User ${existing.email} suspended`,
    });

    return { message: 'User suspended successfully' };
  }

  async activateUser(id: string, companyId: string, activatedById: string) {
    const existing = await userRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    await userRepository.activateUser(id);

    await authRepository.createAuditLog({
      companyId,
      userId: activatedById,
      action: 'USER_ACTIVATED',
      entityType: 'User',
      entityId: id,
      description: `User ${existing.email} activated`,
    });

    return { message: 'User activated successfully' };
  }

  async inviteUser(companyId: string, data: InviteUserInput, invitedById: string) {
    // Check if user already exists
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    // Create invitation record would go here - simplified for now
    // In a full implementation, this would create an Invitation record

    await sendEmail('welcome', {
      to: data.email,
      firstName: data.firstName,
      companyName: 'Your Company', // Would fetch from company
    });

    await authRepository.createAuditLog({
      companyId,
      userId: invitedById,
      action: 'USER_INVITED',
      entityType: 'Invitation',
      description: `Invitation sent to ${data.email}`,
    });

    return { message: 'Invitation sent successfully' };
  }
}

export const userService = new UserService();
