import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class StockMovementRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.StockMovementWhereInput; orderBy?: Prisma.StockMovementOrderByWithRelationInput } = {}) {
    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: { stock: { include: { part: { select: { id: true, name: true, partNumber: true } }, warehouse: { select: { id: true, name: true } } } } },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.stockMovement.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { movements, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.stockMovement.findFirst({ where: { id, companyId, deletedAt: null }, include: { stock: { include: { part: true, warehouse: true } } } });
  }

  async create(data: Prisma.StockMovementCreateInput) {
    return prisma.stockMovement.create({ data });
  }

  async delete(id: string, companyId: string) {
    return prisma.stockMovement.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const stockMovementRepository = new StockMovementRepository();
