import { roleRepository } from '../repositories/role.repository';
import { CreateRoleInput, UpdateRoleInput, CloneRoleInput } from '../validators/role.validator';
import { NotFoundError, ForbiddenError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';

const SYSTEM_PERMISSIONS = [
  'users:create', 'users:read', 'users:update', 'users:delete',
  'company:manage',
  'vehicles:manage',
  'drivers:manage',
  'trips:manage',
  'maintenance:manage',
  'fuel:manage',
  'expenses:manage',
  'invoices:manage',
  'reports:view',
  'settings:manage',
  'branches:manage',
  'departments:manage',
  'roles:manage',
];

export class RoleService {
  async getAllRoles(companyId: string) {
    return roleRepository.findAll(companyId);
  }

  async getRoleById(id: string, companyId: string) {
    const role = await roleRepository.findById(id, companyId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }
    return role;
  }

  async createRole(companyId: string, data: CreateRoleInput, createdById: string) {
    const role = await roleRepository.create({
      ...data,
      company: { connect: { id: companyId } },
    });

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'ROLE_CREATED',
      entityType: 'Role',
      entityId: role.id,
      description: `Role ${role.name} created`,
    });

    return role;
  }

  async updateRole(id: string, companyId: string, data: UpdateRoleInput, updatedById: string) {
    const existing = await roleRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Role not found');
    }

    if (existing.isSystem) {
      throw new ForbiddenError('Cannot modify system roles');
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.permissions) updateData.permissions = data.permissions;

    await roleRepository.update(id, companyId, updateData);

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'ROLE_UPDATED',
      entityType: 'Role',
      entityId: id,
      description: `Role ${existing.name} updated`,
    });

    return roleRepository.findById(id, companyId);
  }

  async deleteRole(id: string, companyId: string, deletedById: string) {
    const existing = await roleRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Role not found');
    }

    if (existing.isSystem) {
      throw new ForbiddenError('Cannot delete system roles');
    }

    await roleRepository.softDelete(id, companyId);

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'ROLE_DELETED',
      entityType: 'Role',
      entityId: id,
      description: `Role ${existing.name} deleted`,
    });

    return { message: 'Role deleted successfully' };
  }

  async cloneRole(id: string, companyId: string, data: CloneRoleInput, clonedById: string) {
    const existing = await roleRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Role not found');
    }

    const role = await roleRepository.create({
      name: data.name,
      description: data.description || `${existing.description} (Copy)`,
      permissions: existing.permissions,
      company: { connect: { id: companyId } },
    });

    await authRepository.createAuditLog({
      companyId,
      userId: clonedById,
      action: 'ROLE_CLONED',
      entityType: 'Role',
      entityId: role.id,
      description: `Role ${existing.name} cloned to ${role.name}`,
    });

    return role;
  }

  getAllPermissions() {
    return SYSTEM_PERMISSIONS;
  }
}

export const roleService = new RoleService();
