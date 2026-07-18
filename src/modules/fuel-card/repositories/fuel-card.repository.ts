import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class FuelCardRepository {
  async findAll(
    companyId: string,
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.FuelCardWhereInput;
      orderBy?: Prisma.FuelCardOrderByWithRelationInput;
    } = {}
  ) {
    const [cards, total] = await Promise.all([
      prisma.fuelCard.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: {
          assignedDriver: { select: { id: true, firstName: true, lastName: true } },
          assignedVehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
        },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.fuelCard.count({
        where: { companyId, deletedAt: null, ...options.where },
      }),
    ]);
    return { cards, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.fuelCard.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        assignedDriver: { select: { id: true, firstName: true, lastName: true } },
        assignedVehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
      },
    });
  }

  async create(data: Prisma.FuelCardCreateInput) {
    return prisma.fuelCard.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.FuelCardUpdateInput) {
    return prisma.fuelCard.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.fuelCard.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
  }

  async findTransactions(fuelCardId: string, options: { skip?: number; take?: number } = {}) {
    const [transactions, total] = await Promise.all([
      prisma.fuelCardTransaction.findMany({
        where: { fuelCardId },
        skip: options.skip,
        take: options.take,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.fuelCardTransaction.count({ where: { fuelCardId } }),
    ]);
    return { transactions, total };
  }

  async createTransaction(data: Prisma.FuelCardTransactionCreateInput) {
    return prisma.fuelCardTransaction.create({ data });
  }

  async getDailySpending(fuelCardId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await prisma.fuelCardTransaction.aggregate({
      where: {
        fuelCardId,
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  }

  async getMonthlySpending(fuelCardId: string, date: Date) {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    const result = await prisma.fuelCardTransaction.aggregate({
      where: {
        fuelCardId,
        timestamp: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  }
}

export const fuelCardRepository = new FuelCardRepository();
