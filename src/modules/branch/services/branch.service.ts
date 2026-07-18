import { branchRepository } from '../repositories/branch.repository';
import { CreateBranchInput, UpdateBranchInput } from '../validators/branch.validator';
import { NotFoundError, ConflictError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';

export class BranchService {
  async getAllBranches(companyId: string) {
    return branchRepository.findAll(companyId);
  }

  async getBranchById(id: string, companyId: string) {
    const branch = await branchRepository.findById(id, companyId);
    if (!branch) {
      throw new NotFoundError('Branch not found');
    }
    return branch;
  }

  async createBranch(companyId: string, data: CreateBranchInput, userId: string) {
    const branch = await branchRepository.create({
      ...data,
      company: { connect: { id: companyId } },
      ...(data.managerId && { manager: { connect: { id: data.managerId } } }),
    });

    await authRepository.createAuditLog({
      companyId,
      userId,
      action: 'BRANCH_CREATED',
      entityType: 'Branch',
      entityId: branch.id,
      description: `Branch ${branch.name} created`,
    });

    return branch;
  }

  async updateBranch(id: string, companyId: string, data: UpdateBranchInput, userId: string) {
    const existing = await branchRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Branch not found');
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.code) updateData.code = data.code;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.managerId !== undefined) updateData.managerId = data.managerId;
    if (data.operatingHours !== undefined) updateData.operatingHours = data.operatingHours;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await branchRepository.update(id, companyId, updateData);

    await authRepository.createAuditLog({
      companyId,
      userId,
      action: 'BRANCH_UPDATED',
      entityType: 'Branch',
      entityId: id,
      description: `Branch ${existing.name} updated`,
    });

    return branchRepository.findById(id, companyId);
  }

  async deleteBranch(id: string, companyId: string, userId: string) {
    const existing = await branchRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Branch not found');
    }

    await branchRepository.softDelete(id, companyId);

    await authRepository.createAuditLog({
      companyId,
      userId,
      action: 'BRANCH_DELETED',
      entityType: 'Branch',
      entityId: id,
      description: `Branch ${existing.name} deleted`,
    });

    return { message: 'Branch deleted successfully' };
  }
}

export const branchService = new BranchService();
