import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class DepartmentRepository {
  async findAll(companyId: string) {
    return prisma.department.findMany({
      where: { companyId, deletedAt: null },
      include: {
        _count: { select: { vehicles: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, companyId: string) {
    return prisma.department.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        vehicles: {
          select: { id: true, registrationNumber: true, make: true, model: true },
        },
      },
    });
  }

  async create(data: Prisma.DepartmentCreateInput) {
    return prisma.department.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.DepartmentUpdateInput) {
    return prisma.department.updateMany({
      where: { id, companyId },
      data,
    });
  }

  async softDelete(id: string, companyId: string) {
    return prisma.department.updateMany({
      where: { id, companyId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}

export const departmentRepository = new DepartmentRepository();
