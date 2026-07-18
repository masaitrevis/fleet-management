import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class GeofenceRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.GeofenceWhereInput; orderBy?: Prisma.GeofenceOrderByWithRelationInput } = {}) {
    const [geofences, total] = await Promise.all([
      prisma.geofence.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.geofence.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { geofences, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.geofence.findFirst({ where: { id, companyId, deletedAt: null } });
  }

  async create(data: Prisma.GeofenceCreateInput) {
    return prisma.geofence.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.GeofenceUpdateInput) {
    return prisma.geofence.updateMany({ where: { id, companyId }, data });
  }

  async softDelete(id: string, companyId: string) {
    return prisma.geofence.updateMany({ where: { id, companyId }, data: { deletedAt: new Date(), isActive: false } });
  }

  async findActiveByVehicle(companyId: string, vehicleId: string) {
    return prisma.geofence.findMany({
      where: {
        companyId,
        deletedAt: null,
        isActive: true,
        OR: [{ vehicles: { has: vehicleId } }, { vehicles: { isEmpty: true } }],
      },
    });
  }
}

export class GeofenceAlertRepository {
  async create(data: Prisma.GeofenceAlertCreateInput) {
    return prisma.geofenceAlert.create({ data });
  }

  async findByGeofence(geofenceId: string, companyId: string) {
    return prisma.geofenceAlert.findMany({
      where: { geofenceId, companyId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }
}

export const geofenceRepository = new GeofenceRepository();
export const geofenceAlertRepository = new GeofenceAlertRepository();
