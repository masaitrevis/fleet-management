import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class WorkshopRepository {
  async findAll(
    companyId: string,
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.ServiceCenterWhereInput;
      orderBy?: Prisma.ServiceCenterOrderByWithRelationInput;
    } = {}
  ) {
    const [workshops, total] = await Promise.all([
      prisma.serviceCenter.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.serviceCenter.count({
        where: { companyId, deletedAt: null, ...options.where },
      }),
    ]);
    return { workshops, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.serviceCenter.findFirst({
      where: { id, companyId, deletedAt: null },
    });
  }

  async create(data: Prisma.ServiceCenterCreateInput) {
    return prisma.serviceCenter.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.ServiceCenterUpdateInput) {
    return prisma.serviceCenter.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.serviceCenter.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
  }
}

export const workshopRepository = new WorkshopRepository();
