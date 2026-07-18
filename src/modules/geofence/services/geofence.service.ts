import { geofenceRepository, geofenceAlertRepository } from '../repositories/geofence.repository';
import {
  CreateGeofenceInput,
  UpdateGeofenceInput,
  GeofenceSearchInput,
  CheckPointInput,
} from '../validators/geofence.validator';
import { NotFoundError, BadRequestError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { Prisma } from '@prisma/client';

export class GeofenceService {
  async getAll(companyId: string, search: GeofenceSearchInput) {
    const where: Prisma.GeofenceWhereInput = {};
    if (search.q) {
      where.OR = [
        { name: { contains: search.q, mode: 'insensitive' } },
        { description: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.type) where.type = search.type as any;
    if (search.isActive !== undefined) where.isActive = search.isActive === 'true';

    const result = await geofenceRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
      orderBy: { [search.sortBy]: search.sortOrder } as any,
    });

    return { ...result, page: search.page, limit: search.limit, totalPages: Math.ceil(result.total / search.limit) };
  }

  async getById(id: string, companyId: string) {
    const geofence = await geofenceRepository.findById(id, companyId);
    if (!geofence) throw new NotFoundError('Geofence not found');
    return geofence;
  }

  async create(companyId: string, data: CreateGeofenceInput, createdById: string) {
    const geofence = await geofenceRepository.create({
      ...data,
      company: { connect: { id: companyId } },
    } as Prisma.GeofenceCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'CREATE',
      entityType: 'Geofence',
      entityId: geofence.id,
      description: `Geofence ${data.name} created`,
    });

    return geofence;
  }

  async update(id: string, companyId: string, data: UpdateGeofenceInput, updatedById: string) {
    const existing = await geofenceRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Geofence not found');

    const updateData: Prisma.GeofenceUpdateInput = {};
    const fields: (keyof UpdateGeofenceInput)[] = [
      'name', 'description', 'type', 'coordinates', 'radius', 'isActive', 'alertType', 'speedLimit', 'vehicles',
    ];
    for (const field of fields) {
      if (data[field] !== undefined) (updateData as any)[field] = data[field];
    }

    await geofenceRepository.update(id, companyId, updateData);

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'UPDATE',
      entityType: 'Geofence',
      entityId: id,
      description: `Geofence ${existing.name} updated`,
    });

    return geofenceRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string, deletedById: string) {
    const existing = await geofenceRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Geofence not found');

    await geofenceRepository.softDelete(id, companyId);

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'DELETE',
      entityType: 'Geofence',
      entityId: id,
      description: `Geofence ${existing.name} deleted`,
    });

    return { message: 'Geofence deleted successfully' };
  }

  isPointInsideGeofence(point: { latitude: number; longitude: number }, geofence: { type: string; coordinates: any; radius?: number | null }) {
    if (geofence.type === 'CIRCLE') {
      const coords = geofence.coordinates as number[][];
      const center = coords[0];
      if (!center || center.length < 2) return false;
      const dx = point.longitude - center[1];
      const dy = point.latitude - center[0];
      const distance = Math.sqrt(dx * dx + dy * dy) * 111320; // approximate meters per degree
      return distance <= (geofence.radius || 0);
    }
    if (geofence.type === 'POLYGON') {
      const coords = geofence.coordinates as number[][];
      let inside = false;
      for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        const xi = coords[i][0], yi = coords[i][1];
        const xj = coords[j][0], yj = coords[j][1];
        const intersect = ((yi > point.longitude) !== (yj > point.longitude)) &&
          (point.latitude < (xj - xi) * (point.longitude - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }
    return false;
  }

  async checkPoint(id: string, companyId: string, point: CheckPointInput) {
    const geofence = await geofenceRepository.findById(id, companyId);
    if (!geofence) throw new NotFoundError('Geofence not found');
    return {
      inside: this.isPointInsideGeofence(point, geofence),
      geofence: { id: geofence.id, name: geofence.name, type: geofence.type },
    };
  }

  async processGeofenceAlerts(companyId: string, vehicleId: string, driverId: string | null, point: { latitude: number; longitude: number; speed?: number | null }) {
    const geofences = await geofenceRepository.findActiveByVehicle(companyId, vehicleId);
    const alerts = [];
    for (const geofence of geofences) {
      const inside = this.isPointInsideGeofence(point, geofence);
      // Check speed limit
      if (geofence.speedLimit && point.speed && point.speed > geofence.speedLimit) {
        alerts.push({
          geofenceId: geofence.id,
          alertType: 'SPEED',
          latitude: point.latitude,
          longitude: point.longitude,
          speed: point.speed,
        });
      }
    }
    return alerts;
  }
}

export const geofenceService = new GeofenceService();
