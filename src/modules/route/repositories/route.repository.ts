import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class RouteRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.RouteWhereInput; orderBy?: Prisma.RouteOrderByWithRelationInput } = {}) {
    const [routes, total] = await Promise.all([
      prisma.route.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: {
          routeStops: { where: { deletedAt: null }, orderBy: { stopOrder: 'asc' } },
          waypoints: { orderBy: { order: 'asc' } },
          _count: { select: { trips: true } },
        },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.route.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { routes, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.route.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        routeStops: { where: { deletedAt: null }, orderBy: { stopOrder: 'asc' } },
        waypoints: { orderBy: { order: 'asc' } },
      },
    });
  }

  async create(data: Prisma.RouteCreateInput) {
    return prisma.route.create({
      data,
      include: {
        routeStops: true,
        waypoints: true,
      },
    });
  }

  async update(id: string, companyId: string, data: Prisma.RouteUpdateInput) {
    return prisma.route.updateMany({ where: { id, companyId }, data });
  }

  async softDelete(id: string, companyId: string) {
    return prisma.route.updateMany({
      where: { id, companyId },
      data: { deletedAt: new Date() },
    });
  }

  async findTemplates(companyId: string) {
    return prisma.route.findMany({
      where: { companyId, deletedAt: null, isActive: true },
      include: {
        routeStops: { where: { deletedAt: null }, orderBy: { stopOrder: 'asc' } },
        waypoints: { orderBy: { order: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  }

  // Route stop operations
  async createRouteStop(data: Prisma.RouteStopCreateInput) {
    return prisma.routeStop.create({ data });
  }

  async updateRouteStop(id: string, routeId: string, data: Prisma.RouteStopUpdateInput) {
    return prisma.routeStop.updateMany({ where: { id, routeId }, data });
  }

  async deleteRouteStopsByRoute(routeId: string) {
    return prisma.routeStop.updateMany({ where: { routeId }, data: { deletedAt: new Date() } });
  }

  async hardDeleteRouteStopsByRoute(routeId: string) {
    return prisma.routeStop.deleteMany({ where: { routeId } });
  }

  // Waypoint operations
  async createWaypoint(data: Prisma.WaypointCreateInput) {
    return prisma.waypoint.create({ data });
  }

  async deleteWaypointsByRoute(routeId: string) {
    return prisma.waypoint.deleteMany({ where: { routeId } });
  }
}

export const routeRepository = new RouteRepository();
