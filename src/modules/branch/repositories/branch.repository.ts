import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class BranchRepository {
  async findAll(companyId: string) {
    return prisma.branch.findMany({
      where: { companyId, deletedAt: null },
      include: {
        _count: { select: { vehicles: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, companyId: string) {
    return prisma.branch.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        vehicles: {
          select: { id: true, registrationNumber: true, make: true, model: true },
        },
      },
    });
  }

  async create(data: Prisma.BranchCreateInput) {
    return prisma.branch.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.BranchUpdateInput) {
    return prisma.branch.updateMany({
      where: { id, companyId },
      data,
    });
  }

  async softDelete(id: string, companyId: string) {
    return prisma.branch.updateMany({
      where: { id, companyId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async countByCompany(companyId: string) {
    return prisma.branch.count({
      where: { companyId, deletedAt: null },
    });
  }
}

export const branchRepository = new BranchRepository();
