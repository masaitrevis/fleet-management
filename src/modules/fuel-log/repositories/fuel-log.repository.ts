import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class FuelLogRepository {
  async findAll(
    companyId: string,
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.FuelLogWhereInput;
      orderBy?: Prisma.FuelLogOrderByWithRelationInput;
    } = {}
  ) {
    const [logs, total] = await Promise.all([
      prisma.fuelLog.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: {
          vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
          driver: { select: { id: true, firstName: true, lastName: true } },
          fuelStation: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
          fuelCard: { select: { id: true, cardNumber: true } },
          trip: { select: { id: true, tripNumber: true } },
        },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { fuelDate: 'desc' },
      }),
      prisma.fuelLog.count({
        where: { companyId, deletedAt: null, ...options.where },
      }),
    ]);
    return { logs, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.fuelLog.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
        fuelStation: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        fuelCard: { select: { id: true, cardNumber: true } },
        trip: { select: { id: true, tripNumber: true } },
        fraudAlerts: true,
      },
    });
  }

  async findPreviousLog(vehicleId: string, beforeDate: Date, companyId: string) {
    return prisma.fuelLog.findFirst({
      where: { vehicleId, companyId, deletedAt: null, fuelDate: { lt: beforeDate } },
      orderBy: { fuelDate: 'desc' },
    });
  }

  async findRecentLogs(vehicleId: string, start: Date, end: Date, companyId: string) {
    return prisma.fuelLog.findMany({
      where: { vehicleId, companyId, deletedAt: null, fuelDate: { gte: start, lte: end } },
      orderBy: { fuelDate: 'desc' },
    });
  }

  async create(data: Prisma.FuelLogCreateInput) {
    return prisma.fuelLog.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.FuelLogUpdateInput) {
    return prisma.fuelLog.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.fuelLog.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
  }
}

export const fuelLogRepository = new FuelLogRepository();
