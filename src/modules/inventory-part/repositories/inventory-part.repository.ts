import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class InventoryPartRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.InventoryPartWhereInput; orderBy?: Prisma.InventoryPartOrderByWithRelationInput } = {}) {
    const [parts, total] = await Promise.all([
      prisma.inventoryPart.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: { category: { select: { id: true, name: true } }, stocks: { where: { deletedAt: null }, include: { warehouse: { select: { id: true, name: true } } } } },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.inventoryPart.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { parts, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.inventoryPart.findFirst({ where: { id, companyId, deletedAt: null }, include: { category: true, stocks: { where: { deletedAt: null }, include: { warehouse: true } } } });
  }

  async findByPartNumber(partNumber: string, companyId: string) {
    return prisma.inventoryPart.findFirst({ where: { partNumber, companyId, deletedAt: null } });
  }

  async findByBarcode(barcode: string, companyId: string) {
    return prisma.inventoryPart.findFirst({ where: { barcode, companyId, deletedAt: null } });
  }

  async create(data: Prisma.InventoryPartCreateInput) {
    return prisma.inventoryPart.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.InventoryPartUpdateInput) {
    return prisma.inventoryPart.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.inventoryPart.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const inventoryPartRepository = new InventoryPartRepository();
