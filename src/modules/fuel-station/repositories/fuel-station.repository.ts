import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class FuelStationRepository {
  async findAll(
    companyId: string,
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.FuelStationWhereInput;
      orderBy?: Prisma.FuelStationOrderByWithRelationInput;
    } = {}
  ) {
    const [stations, total] = await Promise.all([
      prisma.fuelStation.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.fuelStation.count({
        where: { companyId, deletedAt: null, ...options.where },
      }),
    ]);
    return { stations, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.fuelStation.findFirst({
      where: { id, companyId, deletedAt: null },
    });
  }

  async create(data: Prisma.FuelStationCreateInput) {
    return prisma.fuelStation.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.FuelStationUpdateInput) {
    return prisma.fuelStation.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.fuelStation.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
  }
}

export const fuelStationRepository = new FuelStationRepository();
