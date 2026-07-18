import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class WarehouseRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.WarehouseWhereInput; orderBy?: Prisma.WarehouseOrderByWithRelationInput } = {}) {
    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.warehouse.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { warehouses, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.warehouse.findFirst({ where: { id, companyId, deletedAt: null } });
  }

  async findByCode(code: string, companyId: string) {
    return prisma.warehouse.findFirst({ where: { code, companyId, deletedAt: null } });
  }

  async create(data: Prisma.WarehouseCreateInput) {
    return prisma.warehouse.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.WarehouseUpdateInput) {
    return prisma.warehouse.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.warehouse.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const warehouseRepository = new WarehouseRepository();
