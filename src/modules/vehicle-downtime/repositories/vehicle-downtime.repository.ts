import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class VehicleDowntimeRepository {
  async findAll(
    companyId: string,
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.VehicleDowntimeWhereInput;
      orderBy?: Prisma.VehicleDowntimeOrderByWithRelationInput;
    } = {}
  ) {
    const [downtimes, total] = await Promise.all([
      prisma.vehicleDowntime.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: {
          vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
          workOrder: { select: { id: true, workOrderNumber: true, title: true } },
        },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { startDate: 'desc' },
      }),
      prisma.vehicleDowntime.count({
        where: { companyId, deletedAt: null, ...options.where },
      }),
    ]);
    return { downtimes, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.vehicleDowntime.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
        workOrder: { select: { id: true, workOrderNumber: true, title: true } },
      },
    });
  }

  async create(data: Prisma.VehicleDowntimeCreateInput) {
    return prisma.vehicleDowntime.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.VehicleDowntimeUpdateInput) {
    return prisma.vehicleDowntime.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.vehicleDowntime.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
  }
}

export const vehicleDowntimeRepository = new VehicleDowntimeRepository();
