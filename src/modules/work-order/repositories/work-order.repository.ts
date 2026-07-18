import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class WorkOrderRepository {
  async findAll(
    companyId: string,
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.WorkOrderWhereInput;
      orderBy?: Prisma.WorkOrderOrderByWithRelationInput;
    } = {}
  ) {
    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: {
          vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
          mechanic: { select: { id: true, firstName: true, lastName: true } },
          serviceCenter: { select: { id: true, name: true } },
          serviceTemplate: { select: { id: true, name: true } },
          schedule: { select: { id: true, name: true } },
          workOrderChecklists: true,
        },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.workOrder.count({
        where: { companyId, deletedAt: null, ...options.where },
      }),
    ]);
    return { workOrders, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.workOrder.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
        mechanic: { select: { id: true, firstName: true, lastName: true } },
        supervisor: { select: { id: true, firstName: true, lastName: true } },
        serviceCenter: { select: { id: true, name: true } },
        serviceTemplate: { select: { id: true, name: true } },
        schedule: { select: { id: true, name: true } },
        maintenanceRecord: true,
        workOrderChecklists: {
          include: { serviceTemplateItem: true },
        },
      },
    });
  }

  async create(data: Prisma.WorkOrderCreateInput) {
    return prisma.workOrder.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.WorkOrderUpdateInput) {
    return prisma.workOrder.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.workOrder.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
  }
}

export const workOrderRepository = new WorkOrderRepository();
