import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class ShiftRepository {
  async findAll(companyId: string, options: {
    skip?: number;
    take?: number;
    where?: Prisma.ShiftWhereInput;
    orderBy?: Prisma.ShiftOrderByWithRelationInput;
  } = {}) {
    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({
        where: {
          companyId,
          deletedAt: null,
          ...options.where,
        },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.shift.count({
        where: { companyId, deletedAt: null, ...options.where },
      }),
    ]);
    return { shifts, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.shift.findFirst({
      where: { id, companyId, deletedAt: null },
    });
  }

  async create(data: Prisma.ShiftCreateInput) {
    return prisma.shift.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.ShiftUpdateInput) {
    return prisma.shift.updateMany({
      where: { id, companyId },
      data,
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.shift.updateMany({
      where: { id, companyId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async findByType(companyId: string, shiftType: string) {
    return prisma.shift.findMany({
      where: { companyId, shiftType: shiftType as any, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findActive(companyId: string) {
    return prisma.shift.findMany({
      where: { companyId, isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }
}

export const shiftRepository = new ShiftRepository();
