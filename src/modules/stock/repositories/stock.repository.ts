import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class StockRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.StockWhereInput; orderBy?: Prisma.StockOrderByWithRelationInput } = {}) {
    const [stocks, total] = await Promise.all([
      prisma.stock.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: { part: { select: { id: true, name: true, partNumber: true, minimumStock: true } }, warehouse: { select: { id: true, name: true, code: true } } },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.stock.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { stocks, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.stock.findFirst({ where: { id, companyId, deletedAt: null }, include: { part: true, warehouse: true } });
  }

  async findByPartAndWarehouse(partId: string, warehouseId: string, companyId: string) {
    return prisma.stock.findFirst({ where: { partId, warehouseId, companyId, deletedAt: null } });
  }

  async create(data: Prisma.StockCreateInput) {
    return prisma.stock.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.StockUpdateInput) {
    return prisma.stock.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.stock.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const stockRepository = new StockRepository();
