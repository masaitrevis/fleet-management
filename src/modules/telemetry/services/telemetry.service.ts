import { telemetryRepository } from '../repositories/telemetry.repository';
import { TelemetryPointInput, TelemetryBatchInput } from '../validators/telemetry.validator';
import { NotFoundError, BadRequestError } from '@/shared/errors/AppError';
import { prisma } from '@/lib/prisma';

export class TelemetryService {
  async storeTelemetry(companyId: string, data: TelemetryPointInput) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, companyId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    return telemetryRepository.create({
      company: { connect: { id: companyId } },
      vehicle: { connect: { id: data.vehicleId } },
      ...(data.deviceId && { device: { connect: { id: data.deviceId } } }),
      ...(data.tripId && { trip: { connect: { id: data.tripId } } }),
      ...(data.driverId && { driver: { connect: { id: data.driverId } } }),
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data.altitude,
      speed: data.speed,
      heading: data.heading,
      accuracy: data.accuracy,
      ignition: data.ignition,
      engineStatus: data.engineStatus,
      batteryVoltage: data.batteryVoltage,
      fuelLevel: data.fuelLevel,
      engineHours: data.engineHours,
      odometer: data.odometer,
      harshBraking: data.harshBraking,
      harshAcceleration: data.harshAcceleration,
      sharpCornering: data.sharpCornering,
      overspeed: data.overspeed,
      idleTime: data.idleTime,
      distance: data.distance,
      temperature: data.temperature,
      tirePressure: data.tirePressure as any,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    } as any);
  }

  async storeBatch(companyId: string, data: TelemetryBatchInput) {
    const points = [];
    for (const point of data.points) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: point.vehicleId, companyId, deletedAt: null },
      });
      if (!vehicle) continue;
      points.push({
        companyId,
        vehicleId: point.vehicleId,
        deviceId: point.deviceId,
        tripId: point.tripId,
        driverId: point.driverId,
        latitude: point.latitude,
        longitude: point.longitude,
        altitude: point.altitude,
        speed: point.speed,
        heading: point.heading,
        accuracy: point.accuracy,
        ignition: point.ignition,
        engineStatus: point.engineStatus,
        batteryVoltage: point.batteryVoltage,
        fuelLevel: point.fuelLevel,
        engineHours: point.engineHours,
        odometer: point.odometer,
        harshBraking: point.harshBraking,
        harshAcceleration: point.harshAcceleration,
        sharpCornering: point.sharpCornering,
        overspeed: point.overspeed,
        idleTime: point.idleTime,
        distance: point.distance,
        temperature: point.temperature,
        tirePressure: point.tirePressure as any,
        timestamp: point.timestamp ? new Date(point.timestamp) : new Date(),
      });
    }
    if (points.length === 0) throw new BadRequestError('No valid telemetry points to store');
    return telemetryRepository.createMany(points as any);
  }

  async getTelemetry(vehicleId: string, companyId: string, startTime?: Date, endTime?: Date, page = 1, limit = 100) {
    const effectiveStart = startTime || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const effectiveEnd = endTime || new Date();
    return telemetryRepository.findByVehicle(vehicleId, companyId, effectiveStart, effectiveEnd, {
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getStats(vehicleId: string, companyId: string, startTime?: Date, endTime?: Date) {
    const effectiveStart = startTime || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const effectiveEnd = endTime || new Date();
    const stats = await telemetryRepository.getStats(vehicleId, companyId, effectiveStart, effectiveEnd);
    const harshEvents = await telemetryRepository.findHarshEvents(vehicleId, companyId, effectiveStart, effectiveEnd);
    return {
      avgSpeed: stats._avg.speed,
      maxSpeed: stats._max.speed,
      totalDistance: stats._sum.distance,
      avgFuelLevel: stats._avg.fuelLevel,
      avgBatteryVoltage: stats._avg.batteryVoltage,
      maxOdometer: stats._max.odometer,
      minOdometer: stats._min.odometer,
      totalReadings: stats._count.id,
      harshEvents: {
        braking: harshEvents.filter(e => e.harshBraking).length,
        acceleration: harshEvents.filter(e => e.harshAcceleration).length,
        cornering: harshEvents.filter(e => e.sharpCornering).length,
        overspeed: harshEvents.filter(e => e.overspeed).length,
      },
    };
  }

  detectHarshEvents(telemetry: { speed: number | null; heading: number | null; timestamp: Date }[]) {
    const events = [];
    for (let i = 1; i < telemetry.length; i++) {
      const prev = telemetry[i - 1];
      const curr = telemetry[i];
      const timeDiff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
      if (timeDiff <= 0) continue;
      const speedChange = (curr.speed || 0) - (prev.speed || 0);
      const acceleration = speedChange / timeDiff;
      if (acceleration < -4.5) events.push({ type: 'harsh_braking', index: i });
      if (acceleration > 3.5) events.push({ type: 'harsh_acceleration', index: i });
      const headingChange = Math.abs((curr.heading || 0) - (prev.heading || 0));
      if (headingChange > 45 && (curr.speed || 0) > 20) events.push({ type: 'sharp_cornering', index: i });
    }
    return events;
  }
}

export const telemetryService = new TelemetryService();
