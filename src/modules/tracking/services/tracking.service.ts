import { trackingRepository } from '../repositories/tracking.repository';
import { locationUpdateSchema, LocationUpdateInput } from '../validators/tracking.validator';
import { NotFoundError, BadRequestError } from '@/shared/errors/AppError';
import { prisma } from '@/lib/prisma';

export class TrackingService {
  async processLocationUpdate(companyId: string, data: LocationUpdateInput) {
    // Validate vehicle belongs to company
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, companyId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const location = await trackingRepository.create({
      company: { connect: { id: companyId } },
      vehicle: { connect: { id: data.vehicleId } },
      ...(data.deviceId && { device: { connect: { id: data.deviceId } } }),
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data.altitude,
      speed: data.speed,
      heading: data.heading,
      accuracy: data.accuracy,
      batteryLevel: data.batteryLevel,
      ignition: data.ignition,
      address: data.address,
      country: data.country,
      state: data.state,
      city: data.city,
      postalCode: data.postalCode,
      street: data.street,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    } as any);

    // Update device last seen
    if (data.deviceId) {
      await prisma.gPSDevice.updateMany({
        where: { id: data.deviceId, companyId },
        data: { lastSeenAt: new Date(), lastLocationAt: new Date() },
      });
    }

    return location;
  }

  async getLatestLocations(companyId: string) {
    const locations = await trackingRepository.findLatestForAllVehicles(companyId);
    return Array.isArray(locations) ? locations : [];
  }

  async getVehicleHistory(vehicleId: string, companyId: string, startTime?: Date, endTime?: Date, page = 1, limit = 100) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, companyId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const effectiveStart = startTime || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const effectiveEnd = endTime || new Date();

    return trackingRepository.findHistory(vehicleId, companyId, effectiveStart, effectiveEnd, {
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getLatestByVehicle(vehicleId: string, companyId: string) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, companyId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    return trackingRepository.findLatestByVehicle(vehicleId, companyId);
  }

  async getLocationsWithinBounds(companyId: string, north: number, south: number, east: number, west: number) {
    return trackingRepository.findWithinBounds(companyId, north, south, east, west);
  }

  calculateIdleTime(locations: { timestamp: Date; speed: number | null; ignition: boolean | null }[]) {
    let idleTime = 0;
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      const timeDiff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 60000;
      if ((curr.speed === null || curr.speed < 1) && curr.ignition) {
        idleTime += timeDiff;
      }
    }
    return idleTime;
  }

  detectOverspeed(speed: number | null | undefined, limit: number | null | undefined) {
    if (speed == null || limit == null) return false;
    return speed > limit;
  }
}

export const trackingService = new TrackingService();
