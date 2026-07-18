import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class PurchaseOrderRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.PurchaseOrderWhereInput; orderBy?: Prisma.PurchaseOrderOrderByWithRelationInput } = {}) {
    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: { supplier: { select: { id: true, name: true } }, items: { include: { part: { select: { id: true, name: true, partNumber: true } } } } },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.purchaseOrder.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { orders, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.purchaseOrder.findFirst({ where: { id, companyId, deletedAt: null }, include: { supplier: true, items: { include: { part: true } } } });
  }

  async create(data: Prisma.PurchaseOrderCreateInput, items: Prisma.PurchaseOrderItemCreateManyPurchaseOrderInput[]) {
    return prisma.purchaseOrder.create({
      data: { ...data, items: { createMany: { data: items } } },
      include: { supplier: true, items: { include: { part: true } } },
    });
  }

  async update(id: string, companyId: string, data: Prisma.PurchaseOrderUpdateInput) {
    return prisma.purchaseOrder.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.purchaseOrder.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const purchaseOrderRepository = new PurchaseOrderRepository();
