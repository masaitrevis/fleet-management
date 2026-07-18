import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class TrackingRepository {
  async create(data: Prisma.VehicleLocationCreateInput) {
    return prisma.vehicleLocation.create({ data });
  }

  async findLatestByVehicle(vehicleId: string, companyId: string) {
    return prisma.vehicleLocation.findFirst({
      where: { vehicleId, companyId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findLatestForAllVehicles(companyId: string) {
    return prisma.$queryRaw`
      SELECT DISTINCT ON ("vehicleId") *
      FROM "vehicle_locations"
      WHERE "companyId" = ${companyId}::uuid
      ORDER BY "vehicleId", "timestamp" DESC
    `;
  }

  async findHistory(vehicleId: string, companyId: string, startTime: Date, endTime: Date, options: { skip?: number; take?: number } = {}) {
    const [locations, total] = await Promise.all([
      prisma.vehicleLocation.findMany({
        where: { vehicleId, companyId, timestamp: { gte: startTime, lte: endTime } },
        orderBy: { timestamp: 'desc' },
        skip: options.skip,
        take: options.take,
      }),
      prisma.vehicleLocation.count({
        where: { vehicleId, companyId, timestamp: { gte: startTime, lte: endTime } },
      }),
    ]);
    return { locations, total };
  }

  async findWithinBounds(companyId: string, north: number, south: number, east: number, west: number) {
    return prisma.vehicleLocation.findMany({
      where: {
        companyId,
        latitude: { gte: south, lte: north },
        longitude: { gte: west, lte: east },
      },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });
  }

  async findByVehicle(vehicleId: string, companyId: string, limit: number = 100) {
    return prisma.vehicleLocation.findMany({
      where: { vehicleId, companyId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}

export const trackingRepository = new TrackingRepository();
