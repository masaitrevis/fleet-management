import { departmentRepository } from '../repositories/department.repository';
import { CreateDepartmentInput, UpdateDepartmentInput } from '../validators/department.validator';
import { NotFoundError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';

export class DepartmentService {
  async getAllDepartments(companyId: string) {
    return departmentRepository.findAll(companyId);
  }

  async getDepartmentById(id: string, companyId: string) {
    const dept = await departmentRepository.findById(id, companyId);
    if (!dept) {
      throw new NotFoundError('Department not found');
    }
    return dept;
  }

  async createDepartment(companyId: string, data: CreateDepartmentInput, userId: string) {
    const dept = await departmentRepository.create({
      ...data,
      company: { connect: { id: companyId } },
      ...(data.managerId && { manager: { connect: { id: data.managerId } } }),
    });

    await authRepository.createAuditLog({
      companyId,
      userId,
      action: 'DEPARTMENT_CREATED',
      entityType: 'Department',
      entityId: dept.id,
      description: `Department ${dept.name} created`,
    });

    return dept;
  }

  async updateDepartment(id: string, companyId: string, data: UpdateDepartmentInput, userId: string) {
    const existing = await departmentRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Department not found');
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.managerId !== undefined) updateData.managerId = data.managerId;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await departmentRepository.update(id, companyId, updateData);

    await authRepository.createAuditLog({
      companyId,
      userId,
      action: 'DEPARTMENT_UPDATED',
      entityType: 'Department',
      entityId: id,
      description: `Department ${existing.name} updated`,
    });

    return departmentRepository.findById(id, companyId);
  }

  async deleteDepartment(id: string, companyId: string, userId: string) {
    const existing = await departmentRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Department not found');
    }

    await departmentRepository.softDelete(id, companyId);

    await authRepository.createAuditLog({
      companyId,
      userId,
      action: 'DEPARTMENT_DELETED',
      entityType: 'Department',
      entityId: id,
      description: `Department ${existing.name} deleted`,
    });

    return { message: 'Department deleted successfully' };
  }
}

export const departmentService = new DepartmentService();
