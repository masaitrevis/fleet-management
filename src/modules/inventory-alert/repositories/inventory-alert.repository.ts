import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class InventoryAlertRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.InventoryAlertWhereInput; orderBy?: Prisma.InventoryAlertOrderByWithRelationInput } = {}) {
    const [alerts, total] = await Promise.all([
      prisma.inventoryAlert.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: { warehouse: { select: { id: true, name: true } } },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.inventoryAlert.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { alerts, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.inventoryAlert.findFirst({ where: { id, companyId, deletedAt: null }, include: { warehouse: true } });
  }

  async create(data: Prisma.InventoryAlertCreateInput) {
    return prisma.inventoryAlert.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.InventoryAlertUpdateInput) {
    return prisma.inventoryAlert.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.inventoryAlert.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }

  async countUnread(companyId: string) {
    return prisma.inventoryAlert.count({ where: { companyId, deletedAt: null, isRead: false } });
  }
}

export const inventoryAlertRepository = new InventoryAlertRepository();
