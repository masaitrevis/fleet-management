import { routeRepository } from '../repositories/route.repository';
import {
  CreateRouteInput,
  UpdateRouteInput,
  RouteSearchInput,
} from '../validators/route.validator';
import { NotFoundError, BadRequestError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class RouteService {
  async getAll(companyId: string, search: RouteSearchInput) {
    const where: Prisma.RouteWhereInput = {};
    if (search.q) {
      where.OR = [
        { name: { contains: search.q, mode: 'insensitive' } },
        { description: { contains: search.q, mode: 'insensitive' } },
        { startLocation: { contains: search.q, mode: 'insensitive' } },
        { endLocation: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.isActive === 'true') where.isActive = true;
    if (search.isActive === 'false') where.isActive = false;

    const result = await routeRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
      orderBy: { [search.sortBy]: search.sortOrder } as any,
    });

    return { ...result, page: search.page, limit: search.limit, totalPages: Math.ceil(result.total / search.limit) };
  }

  async getById(id: string, companyId: string) {
    const route = await routeRepository.findById(id, companyId);
    if (!route) throw new NotFoundError('Route not found');
    return route;
  }

  async create(companyId: string, data: CreateRouteInput, createdById: string) {
    const { routeStops, waypoints, ...routeData } = data;

    const route = await routeRepository.create({
      ...routeData,
      company: { connect: { id: companyId } },
    } as Prisma.RouteCreateInput);

    // Create route stops
    if (routeStops && routeStops.length > 0) {
      for (const stop of routeStops) {
        await routeRepository.createRouteStop({
          route: { connect: { id: route.id } },
          name: stop.name,
          address: stop.address,
          latitude: stop.latitude,
          longitude: stop.longitude,
          stopOrder: stop.stopOrder,
          estimatedWaitTime: stop.estimatedWaitTime,
          stopType: stop.stopType as any,
          isActive: stop.isActive,
        } as Prisma.RouteStopCreateInput);
      }
    }

    // Create waypoints
    if (waypoints && waypoints.length > 0) {
      for (const wp of waypoints) {
        await routeRepository.createWaypoint({
          route: { connect: { id: route.id } },
          latitude: wp.latitude,
          longitude: wp.longitude,
          order: wp.order,
        } as Prisma.WaypointCreateInput);
      }
    }

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'ROUTE_CREATED',
      entityType: 'Route',
      entityId: route.id,
      description: `Route ${data.name} created`,
    });

    return routeRepository.findById(route.id, companyId);
  }

  async update(id: string, companyId: string, data: UpdateRouteInput, updatedById: string) {
    const existing = await routeRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Route not found');

    const updateData: Prisma.RouteUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startLocation !== undefined) updateData.startLocation = data.startLocation;
    if (data.endLocation !== undefined) updateData.endLocation = data.endLocation;
    if (data.startLat !== undefined) updateData.startLat = data.startLat;
    if (data.startLng !== undefined) updateData.startLng = data.startLng;
    if (data.endLat !== undefined) updateData.endLat = data.endLat;
    if (data.endLng !== undefined) updateData.endLng = data.endLng;
    if (data.distance !== undefined) updateData.distance = data.distance;
    if (data.estimatedDuration !== undefined) updateData.estimatedDuration = data.estimatedDuration;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if ((data as any).isOptimized !== undefined) updateData.isOptimized = (data as any).isOptimized;

    await routeRepository.update(id, companyId, updateData);

    // Handle nested updates - if routeStops or waypoints are provided, replace them
    if (data.routeStops !== undefined) {
      await routeRepository.hardDeleteRouteStopsByRoute(id);
      if (data.routeStops && data.routeStops.length > 0) {
        for (const stop of data.routeStops) {
          await routeRepository.createRouteStop({
            route: { connect: { id } },
            name: stop.name,
            address: stop.address,
            latitude: stop.latitude,
            longitude: stop.longitude,
            stopOrder: stop.stopOrder,
            estimatedWaitTime: stop.estimatedWaitTime,
            stopType: stop.stopType as any,
            isActive: stop.isActive,
          } as Prisma.RouteStopCreateInput);
        }
      }
    }

    if (data.waypoints !== undefined) {
      await routeRepository.deleteWaypointsByRoute(id);
      if (data.waypoints && data.waypoints.length > 0) {
        for (const wp of data.waypoints) {
          await routeRepository.createWaypoint({
            route: { connect: { id } },
            latitude: wp.latitude,
            longitude: wp.longitude,
            order: wp.order,
          } as Prisma.WaypointCreateInput);
        }
      }
    }

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'ROUTE_UPDATED',
      entityType: 'Route',
      entityId: id,
      description: `Route ${existing.name} updated`,
    });

    return routeRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string, deletedById: string) {
    const existing = await routeRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Route not found');

    // Check if route is used in any active trips
    const activeTrips = await prisma.trip.findMany({
      where: { routeId: id, companyId, status: { notIn: ['COMPLETED', 'CANCELLED'] }, deletedAt: null },
    });
    if (activeTrips.length > 0) {
      throw new BadRequestError('Cannot delete route that is used in active trips');
    }

    await routeRepository.softDelete(id, companyId);

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'ROUTE_DELETED',
      entityType: 'Route',
      entityId: id,
      description: `Route ${existing.name} deleted`,
    });

    return { message: 'Route deleted successfully' };
  }

  async getTemplates(companyId: string) {
    return routeRepository.findTemplates(companyId);
  }
}

export const routeService = new RouteService();
