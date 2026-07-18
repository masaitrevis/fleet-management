import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class TelemetryRepository {
  async create(data: Prisma.TelemetryDataCreateInput) {
    return prisma.telemetryData.create({ data });
  }

  async createMany(data: Prisma.TelemetryDataCreateManyInput[]) {
    return prisma.telemetryData.createMany({ data, skipDuplicates: true });
  }

  async findByVehicle(vehicleId: string, companyId: string, startTime?: Date, endTime?: Date, options: { skip?: number; take?: number } = {}) {
    const [telemetry, total] = await Promise.all([
      prisma.telemetryData.findMany({
        where: {
          vehicleId,
          companyId,
          ...(startTime && endTime && { timestamp: { gte: startTime, lte: endTime } }),
        },
        orderBy: { timestamp: 'desc' },
        skip: options.skip,
        take: options.take,
      }),
      prisma.telemetryData.count({
        where: {
          vehicleId,
          companyId,
          ...(startTime && endTime && { timestamp: { gte: startTime, lte: endTime } }),
        },
      }),
    ]);
    return { telemetry, total };
  }

  async getStats(vehicleId: string, companyId: string, startTime: Date, endTime: Date) {
    const result = await prisma.telemetryData.aggregate({
      where: { vehicleId, companyId, timestamp: { gte: startTime, lte: endTime } },
      _avg: { speed: true, fuelLevel: true, batteryVoltage: true },
      _max: { speed: true, odometer: true },
      _min: { odometer: true },
      _sum: { distance: true },
      _count: { id: true },
    });
    return result;
  }

  async findHarshEvents(vehicleId: string, companyId: string, startTime: Date, endTime: Date) {
    return prisma.telemetryData.findMany({
      where: {
        vehicleId,
        companyId,
        timestamp: { gte: startTime, lte: endTime },
        OR: [
          { harshBraking: true },
          { harshAcceleration: true },
          { sharpCornering: true },
          { overspeed: true },
        ],
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}

export const telemetryRepository = new TelemetryRepository();
