import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class MaintenanceScheduleRepository {
  async findAll(
    companyId: string,
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.MaintenanceScheduleWhereInput;
      orderBy?: Prisma.MaintenanceScheduleOrderByWithRelationInput;
    } = {}
  ) {
    const [schedules, total] = await Promise.all([
      prisma.maintenanceSchedule.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: {
          vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
          workOrders: { select: { id: true, status: true } },
        },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { nextDueDate: 'asc' },
      }),
      prisma.maintenanceSchedule.count({
        where: { companyId, deletedAt: null, ...options.where },
      }),
    ]);
    return { schedules, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.maintenanceSchedule.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
        maintenanceRecords: { select: { id: true, serviceDate: true, status: true } },
        workOrders: { select: { id: true, workOrderNumber: true, status: true } },
      },
    });
  }

  async findOverdue(companyId: string) {
    return prisma.maintenanceSchedule.findMany({
      where: {
        companyId,
        deletedAt: null,
        isActive: true,
        nextDueDate: { lt: new Date() },
      },
      include: {
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
      },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async create(data: Prisma.MaintenanceScheduleCreateInput) {
    return prisma.maintenanceSchedule.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.MaintenanceScheduleUpdateInput) {
    return prisma.maintenanceSchedule.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.maintenanceSchedule.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
  }
}

export const maintenanceScheduleRepository = new MaintenanceScheduleRepository();
