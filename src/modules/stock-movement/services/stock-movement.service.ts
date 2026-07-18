import { stockMovementRepository } from '../repositories/stock-movement.repository';
import { CreateStockMovementInput, StockMovementSearchInput } from '../validators/stock-movement.validator';
import { NotFoundError, BadRequestError } from '@/shared/errors/AppError';
import { prisma } from '@/lib/prisma';

export class StockMovementService {
  async getAll(companyId: string, search: StockMovementSearchInput) {
    const where: any = { deletedAt: null };
    if (search.stockId) where.stockId = search.stockId;
    if (search.movementType) where.movementType = search.movementType;
    if (search.startDate || search.endDate) {
      where.createdAt = {};
      if (search.startDate) where.createdAt.gte = new Date(search.startDate);
      if (search.endDate) where.createdAt.lte = new Date(search.endDate);
    }
    return stockMovementRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
    });
  }

  async getById(id: string, companyId: string) {
    const movement = await stockMovementRepository.findById(id, companyId);
    if (!movement) throw new NotFoundError('Stock movement not found');
    return movement;
  }

  async create(companyId: string, data: CreateStockMovementInput) {
    const stock = await prisma.stock.findFirst({ where: { id: data.stockId, companyId, deletedAt: null } });
    if (!stock) throw new NotFoundError('Stock record not found');

    const movement = await stockMovementRepository.create({
      ...data,
      company: { connect: { id: companyId } },
      stock: { connect: { id: data.stockId } },
    } as any);

    // Update stock quantity
    const qtyChange = data.quantity;
    await prisma.stock.update({
      where: { id: data.stockId },
      data: { quantity: { increment: qtyChange }, availableQuantity: { increment: qtyChange }, updatedAt: new Date() },
    });

    return movement;
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return stockMovementRepository.delete(id, companyId);
  }
}

export const stockMovementService = new StockMovementService();
