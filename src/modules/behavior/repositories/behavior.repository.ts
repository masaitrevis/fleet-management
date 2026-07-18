import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class BehaviorRepository {
  async findByDriver(driverId: string, companyId: string, startTime?: Date, endTime?: Date) {
    const where: Prisma.DriverBehaviorWhereInput = { driverId, companyId };
    if (startTime && endTime) {
      where.periodStart = { gte: startTime };
      where.periodEnd = { lte: endTime };
    }
    return prisma.driverBehavior.findMany({
      where,
      include: {
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
      },
      orderBy: { periodStart: 'desc' },
    });
  }

  async findByDriverAndPeriod(driverId: string, companyId: string, periodStart: Date, periodEnd: Date) {
    return prisma.driverBehavior.findFirst({
      where: { driverId, companyId, periodStart, periodEnd },
      include: {
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
      },
    });
  }

  async create(data: Prisma.DriverBehaviorCreateInput) {
    return prisma.driverBehavior.create({ data, include: { vehicle: { select: { id: true, registrationNumber: true } } } });
  }

  async update(id: string, companyId: string, data: Prisma.DriverBehaviorUpdateInput) {
    return prisma.driverBehavior.updateMany({ where: { id, companyId }, data });
  }

  async findLatest(driverId: string, companyId: string) {
    return prisma.driverBehavior.findFirst({
      where: { driverId, companyId },
      orderBy: { periodStart: 'desc' },
    });
  }
}

export const behaviorRepository = new BehaviorRepository();
