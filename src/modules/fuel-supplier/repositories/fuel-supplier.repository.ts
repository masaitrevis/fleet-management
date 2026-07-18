import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class FuelSupplierRepository {
  async findAll(
    companyId: string,
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.FuelSupplierWhereInput;
      orderBy?: Prisma.FuelSupplierOrderByWithRelationInput;
    } = {}
  ) {
    const [suppliers, total] = await Promise.all([
      prisma.fuelSupplier.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.fuelSupplier.count({
        where: { companyId, deletedAt: null, ...options.where },
      }),
    ]);
    return { suppliers, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.fuelSupplier.findFirst({
      where: { id, companyId, deletedAt: null },
    });
  }

  async create(data: Prisma.FuelSupplierCreateInput) {
    return prisma.fuelSupplier.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.FuelSupplierUpdateInput) {
    return prisma.fuelSupplier.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.fuelSupplier.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
  }
}

export const fuelSupplierRepository = new FuelSupplierRepository();
