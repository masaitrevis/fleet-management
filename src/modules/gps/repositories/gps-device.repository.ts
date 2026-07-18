import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class GPSDeviceRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.GPSDeviceWhereInput; orderBy?: Prisma.GPSDeviceOrderByWithRelationInput } = {}) {
    const [devices, total] = await Promise.all([
      prisma.gPSDevice.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: {
          vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
        },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.gPSDevice.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { devices, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.gPSDevice.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
      },
    });
  }

  async create(data: Prisma.GPSDeviceCreateInput) {
    return prisma.gPSDevice.create({ data, include: { vehicle: { select: { id: true, registrationNumber: true } } } });
  }

  async update(id: string, companyId: string, data: Prisma.GPSDeviceUpdateInput) {
    return prisma.gPSDevice.updateMany({ where: { id, companyId }, data });
  }

  async softDelete(id: string, companyId: string) {
    return prisma.gPSDevice.updateMany({
      where: { id, companyId },
      data: { deletedAt: new Date(), status: 'DECOMMISSIONED' as any },
    });
  }

  async findByImei(companyId: string, imei: string) {
    return prisma.gPSDevice.findFirst({ where: { companyId, imei, deletedAt: null } });
  }

  async findByDeviceId(companyId: string, deviceId: string) {
    return prisma.gPSDevice.findFirst({ where: { companyId, deviceId, deletedAt: null } });
  }

  async findByVehicle(vehicleId: string) {
    return prisma.gPSDevice.findFirst({
      where: { vehicle: { some: { id: vehicleId } }, deletedAt: null },
    });
  }

  async getFilterOptions(companyId: string) {
    const [statuses, manufacturers] = await Promise.all([
      prisma.gPSDevice.findMany({ where: { companyId, deletedAt: null }, select: { status: true }, distinct: ['status'] }).then(r => r.map(d => d.status)),
      prisma.gPSDevice.findMany({ where: { companyId, deletedAt: null }, select: { manufacturer: true }, distinct: ['manufacturer'] }).then(r => r.map(d => d.manufacturer).filter(Boolean)),
    ]);
    return { statuses, manufacturers };
  }
}

export const gpsDeviceRepository = new GPSDeviceRepository();
