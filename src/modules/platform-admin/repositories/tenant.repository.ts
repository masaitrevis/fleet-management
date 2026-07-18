import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class TenantRepository {
  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CompanyWhereInput;
    orderBy?: Prisma.CompanyOrderByWithRelationInput;
  }) {
    const [items, total] = await Promise.all([
      prisma.company.findMany({
        ...params,
        include: {
          subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { companyUsers: true, vehicles: true, drivers: true } },
        },
      }),
      prisma.company.count({ where: params.where }),
    ]);
    return { items, total };
  }

  async findById(id: string) {
    return prisma.company.findUnique({
      where: { id },
      include: {
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { companyUsers: true, vehicles: true, drivers: true, trips: true } },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return prisma.company.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async softDelete(id: string) {
    return prisma.company.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  async getUsageStats(id: string) {
    const [userCount, vehicleCount, driverCount, tripCount, activeTripCount] = await Promise.all([
      prisma.companyUser.count({ where: { companyId: id, deletedAt: null } }),
      prisma.vehicle.count({ where: { companyId: id, deletedAt: null } }),
      prisma.driver.count({ where: { companyId: id, deletedAt: null } }),
      prisma.trip.count({ where: { companyId: id, deletedAt: null } }),
      prisma.trip.count({ where: { companyId: id, status: { in: ['IN_PROGRESS', 'ASSIGNED'] }, deletedAt: null } }),
    ]);
    return { userCount, vehicleCount, driverCount, tripCount, activeTripCount };
  }
}
