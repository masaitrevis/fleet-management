import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class AlertRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.VehicleAlertWhereInput; orderBy?: Prisma.VehicleAlertOrderByWithRelationInput } = {}) {
    const [alerts, total] = await Promise.all([
      prisma.vehicleAlert.findMany({
        where: { companyId, ...options.where },
        include: {
          vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
          driver: { select: { id: true, firstName: true, lastName: true } },
        },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.vehicleAlert.count({ where: { companyId, ...options.where } }),
    ]);
    return { alerts, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.vehicleAlert.findFirst({
      where: { id, companyId },
      include: {
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: Prisma.VehicleAlertCreateInput) {
    return prisma.vehicleAlert.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.VehicleAlertUpdateInput) {
    return prisma.vehicleAlert.updateMany({ where: { id, companyId }, data });
  }

  async acknowledge(id: string, companyId: string, userId: string) {
    return prisma.vehicleAlert.updateMany({
      where: { id, companyId },
      data: {
        status: 'ACKNOWLEDGED',
        isAcknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
      },
    });
  }

  async resolve(id: string, companyId: string, userId: string, resolutionNotes?: string) {
    return prisma.vehicleAlert.updateMany({
      where: { id, companyId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolutionNotes,
      },
    });
  }

  async dismiss(id: string, companyId: string, userId: string) {
    return prisma.vehicleAlert.updateMany({
      where: { id, companyId },
      data: {
        status: 'DISMISSED',
        resolvedAt: new Date(),
        resolvedBy: userId,
      },
    });
  }
}

export const alertRepository = new AlertRepository();
