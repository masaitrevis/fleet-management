import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class MechanicRepository {
  async findAll(
    companyId: string,
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.MechanicWhereInput;
      orderBy?: Prisma.MechanicOrderByWithRelationInput;
    } = {}
  ) {
    const [mechanics, total] = await Promise.all([
      prisma.mechanic.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.mechanic.count({
        where: { companyId, deletedAt: null, ...options.where },
      }),
    ]);
    return { mechanics, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.mechanic.findFirst({
      where: { id, companyId, deletedAt: null },
    });
  }

  async findByEmployeeId(employeeId: string, companyId: string) {
    return prisma.mechanic.findFirst({
      where: { employeeId, companyId, deletedAt: null },
    });
  }

  async findJobs(id: string, companyId: string) {
    return prisma.workOrder.findMany({
      where: { mechanicId: id, companyId, deletedAt: null },
      include: { vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.MechanicCreateInput) {
    return prisma.mechanic.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.MechanicUpdateInput) {
    return prisma.mechanic.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.mechanic.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
  }
}

export const mechanicRepository = new MechanicRepository();
