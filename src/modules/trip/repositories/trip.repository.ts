import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class TripRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.TripWhereInput; orderBy?: Prisma.TripOrderByWithRelationInput } = {}) {
    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: {
          vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
          driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
          route: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          _count: { select: { tripStops: true, tripCargos: true, tripTimelines: true } },
        },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.trip.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { trips, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.trip.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true, color: true } },
        driver: { select: { id: true, firstName: true, lastName: true, phone: true, photo: true } },
        route: { select: { id: true, name: true, startLocation: true, endLocation: true } },
        customer: { select: { id: true, name: true, email: true, phone: true } },
        tripStops: { orderBy: { stopOrder: 'asc' } },
        tripCargos: true,
        tripTimelines: { orderBy: { eventTime: 'desc' } },
        tripChecklists: true,
        tripInspections: { orderBy: { inspectedAt: 'desc' } },
      },
    });
  }

  async create(data: Prisma.TripCreateInput) {
    return prisma.trip.create({ data, include: { vehicle: true, driver: true } });
  }

  async update(id: string, companyId: string, data: Prisma.TripUpdateInput) {
    return prisma.trip.updateMany({ where: { id, companyId }, data });
  }

  async softDelete(id: string, companyId: string) {
    return prisma.trip.updateMany({
      where: { id, companyId },
      data: { deletedAt: new Date(), status: 'CANCELLED' as any },
    });
  }

  async findOverlappingTrips(companyId: string, options: { vehicleId?: string; driverId?: string; startTime?: Date; endTime?: Date; excludeTripId?: string }) {
    const where: Prisma.TripWhereInput = {
      companyId,
      deletedAt: null,
      status: { notIn: ['COMPLETED', 'CANCELLED'] as any[] },
    };
    if (options.vehicleId) where.vehicleId = options.vehicleId;
    if (options.driverId) where.driverId = options.driverId;
    if (options.excludeTripId) where.id = { not: options.excludeTripId };

    if (options.startTime && options.endTime) {
      where.AND = [
        { startTime: { lt: options.endTime } },
        { estimatedEndTime: { gt: options.startTime } },
      ];
    } else if (options.startTime) {
      where.startTime = { lte: options.startTime };
      where.OR = [
        { estimatedEndTime: { gte: options.startTime } },
        { estimatedEndTime: null },
      ];
    }

    return prisma.trip.findMany({ where });
  }

  async findByTripNumber(companyId: string, tripNumber: string) {
    return prisma.trip.findFirst({ where: { companyId, tripNumber, deletedAt: null } });
  }

  async getFilterOptions(companyId: string) {
    const [statuses, priorities, vehicles, drivers] = await Promise.all([
      prisma.trip.findMany({ where: { companyId, deletedAt: null }, select: { status: true }, distinct: ['status'] }).then(r => r.map(t => t.status)),
      prisma.trip.findMany({ where: { companyId, deletedAt: null }, select: { priority: true }, distinct: ['priority'] }).then(r => r.map(t => t.priority).filter(Boolean)),
      prisma.vehicle.findMany({ where: { companyId, deletedAt: null }, select: { id: true, registrationNumber: true } }),
      prisma.driver.findMany({ where: { companyId, deletedAt: null }, select: { id: true, firstName: true, lastName: true } }),
    ]);
    return { statuses, priorities, vehicles, drivers };
  }

  async generateTripNumber(companyId: string) {
    const year = new Date().getFullYear();
    const prefix = `TRP-${year}`;
    const count = await prisma.trip.count({
      where: { companyId, tripNumber: { startsWith: prefix } },
    });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  // Trip stop operations
  async createTripStop(data: Prisma.TripStopCreateInput) {
    return prisma.tripStop.create({ data });
  }

  async updateTripStop(id: string, tripId: string, data: Prisma.TripStopUpdateInput) {
    return prisma.tripStop.updateMany({ where: { id, tripId }, data });
  }

  async deleteTripStopsByTrip(tripId: string) {
    return prisma.tripStop.deleteMany({ where: { tripId } });
  }

  // Trip cargo operations
  async createTripCargo(data: Prisma.TripCargoCreateInput) {
    return prisma.tripCargo.create({ data });
  }

  async deleteTripCargosByTrip(tripId: string) {
    return prisma.tripCargo.deleteMany({ where: { tripId } });
  }

  // Trip checklist operations
  async createTripChecklist(data: Prisma.TripChecklistCreateInput) {
    return prisma.tripChecklist.create({ data });
  }

  async updateTripChecklist(id: string, data: Prisma.TripChecklistUpdateInput) {
    return prisma.tripChecklist.update({ where: { id }, data });
  }

  async deleteTripChecklistsByTrip(tripId: string) {
    return prisma.tripChecklist.deleteMany({ where: { tripId } });
  }

  async findChecklistByTrip(tripId: string) {
    return prisma.tripChecklist.findMany({ where: { tripId } });
  }

  // Trip timeline operations
  async createTimeline(data: Prisma.TripTimelineCreateInput) {
    return prisma.tripTimeline.create({ data });
  }

  async findTimelinesByTrip(tripId: string) {
    return prisma.tripTimeline.findMany({ where: { tripId }, orderBy: { eventTime: 'desc' } });
  }

  // Trip inspection operations
  async createInspection(data: Prisma.TripInspectionCreateInput) {
    return prisma.tripInspection.create({ data });
  }

  async findInspectionsByTrip(tripId: string) {
    return prisma.tripInspection.findMany({ where: { tripId }, orderBy: { inspectedAt: 'desc' } });
  }
}

export class TripStopRepository {
  async create(data: Prisma.TripStopCreateInput) {
    return prisma.tripStop.create({ data });
  }

  async update(id: string, tripId: string, data: Prisma.TripStopUpdateInput) {
    return prisma.tripStop.updateMany({ where: { id, tripId }, data });
  }

  async findById(id: string, tripId: string) {
    return prisma.tripStop.findFirst({ where: { id, tripId } });
  }
}

export const tripRepository = new TripRepository();
export const tripStopRepository = new TripStopRepository();
