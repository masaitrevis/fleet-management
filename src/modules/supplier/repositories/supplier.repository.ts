import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class SupplierRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.SupplierWhereInput; orderBy?: Prisma.SupplierOrderByWithRelationInput } = {}) {
    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { name: 'asc' },
      }),
      prisma.supplier.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { suppliers, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.supplier.findFirst({ where: { id, companyId, deletedAt: null } });
  }

  async create(data: Prisma.SupplierCreateInput) {
    return prisma.supplier.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.SupplierUpdateInput) {
    return prisma.supplier.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.supplier.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const supplierRepository = new SupplierRepository();
