import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class MaintenanceRecordRepository {
  async findAll(
    companyId: string,
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.MaintenanceRecordWhereInput;
      orderBy?: Prisma.MaintenanceRecordOrderByWithRelationInput;
    } = {}
  ) {
    const [records, total] = await Promise.all([
      prisma.maintenanceRecord.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: {
          vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
          schedule: { select: { id: true, name: true } },
          serviceCenter: { select: { id: true, name: true } },
          mechanic: { select: { id: true, firstName: true, lastName: true } },
          workOrder: { select: { id: true, workOrderNumber: true } },
          spareParts: true,
          maintenanceCosts: true,
        },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { serviceDate: 'desc' },
      }),
      prisma.maintenanceRecord.count({
        where: { companyId, deletedAt: null, ...options.where },
      }),
    ]);
    return { records, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.maintenanceRecord.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
        schedule: { select: { id: true, name: true } },
        serviceCenter: { select: { id: true, name: true } },
        mechanic: { select: { id: true, firstName: true, lastName: true } },
        workOrder: { select: { id: true, workOrderNumber: true } },
        spareParts: true,
        maintenanceCosts: true,
      },
    });
  }

  async create(data: Prisma.MaintenanceRecordCreateInput) {
    return prisma.maintenanceRecord.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.MaintenanceRecordUpdateInput) {
    return prisma.maintenanceRecord.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.maintenanceRecord.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
  }
}

export const maintenanceRecordRepository = new MaintenanceRecordRepository();
