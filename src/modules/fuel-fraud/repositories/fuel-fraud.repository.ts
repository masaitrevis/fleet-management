import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class FuelFraudRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.FuelFraudAlertWhereInput; orderBy?: Prisma.FuelFraudAlertOrderByWithRelationInput } = {}) {
    const [alerts, total] = await Promise.all([
      prisma.fuelFraudAlert.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: {
          fuelLog: { select: { id: true, fuelDate: true, totalCost: true, quantity: true } },
          vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
          driver: { select: { id: true, firstName: true, lastName: true } },
        },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { detectedAt: 'desc' },
      }),
      prisma.fuelFraudAlert.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { alerts, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.fuelFraudAlert.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        fuelLog: true,
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: Prisma.FuelFraudAlertCreateInput) {
    return prisma.fuelFraudAlert.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.FuelFraudAlertUpdateInput) {
    return prisma.fuelFraudAlert.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { ...data, updatedAt: new Date() },
    });
  }
}

export const fuelFraudRepository = new FuelFraudRepository();
