import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class WarehouseTransferRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.WarehouseTransferWhereInput; orderBy?: Prisma.WarehouseTransferOrderByWithRelationInput } = {}) {
    const [transfers, total] = await Promise.all([
      prisma.warehouseTransfer.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: {
          sourceWarehouse: { select: { id: true, name: true, code: true } },
          destinationWarehouse: { select: { id: true, name: true, code: true } },
          items: { include: { part: { select: { id: true, name: true, partNumber: true } } } },
        },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.warehouseTransfer.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { transfers, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.warehouseTransfer.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { sourceWarehouse: true, destinationWarehouse: true, items: { include: { part: true } } },
    });
  }

  async create(data: Prisma.WarehouseTransferCreateInput, items: Prisma.WarehouseTransferItemCreateManyTransferInput[]) {
    return prisma.warehouseTransfer.create({
      data: { ...data, items: { createMany: { data: items } } },
      include: { sourceWarehouse: true, destinationWarehouse: true, items: { include: { part: true } } },
    });
  }

  async update(id: string, companyId: string, data: Prisma.WarehouseTransferUpdateInput) {
    return prisma.warehouseTransfer.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.warehouseTransfer.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const warehouseTransferRepository = new WarehouseTransferRepository();
