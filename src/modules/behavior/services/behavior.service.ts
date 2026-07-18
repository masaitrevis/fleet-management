import { behaviorRepository } from '../repositories/behavior.repository';
import { BehaviorPeriodInput } from '../validators/behavior.validator';
import { NotFoundError } from '@/shared/errors/AppError';
import { prisma } from '@/lib/prisma';

export class BehaviorService {
  async getByDriver(driverId: string, companyId: string, period?: BehaviorPeriodInput) {
    const driver = await prisma.driver.findFirst({
      where: { id: driverId, companyId, deletedAt: null },
    });
    if (!driver) throw new NotFoundError('Driver not found');

    const startTime = period?.startTime ? new Date(period.startTime) : undefined;
    const endTime = period?.endTime ? new Date(period.endTime) : undefined;
    return behaviorRepository.findByDriver(driverId, companyId, startTime, endTime);
  }

  async getPeriods(driverId: string, companyId: string) {
    const driver = await prisma.driver.findFirst({
      where: { id: driverId, companyId, deletedAt: null },
    });
    if (!driver) throw new NotFoundError('Driver not found');

    const behaviors = await behaviorRepository.findByDriver(driverId, companyId);
    return behaviors.map(b => ({
      periodStart: b.periodStart,
      periodEnd: b.periodEnd,
      safetyScore: b.safetyScore,
      aggressiveScore: b.aggressiveScore,
      efficiencyScore: b.efficiencyScore,
    }));
  }

  async calculateFromTelemetry(driverId: string, companyId: string, vehicleId: string, periodStart: Date, periodEnd: Date) {
    const telemetry = await prisma.telemetryData.findMany({
      where: {
        driverId,
        companyId,
        vehicleId,
        timestamp: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (telemetry.length === 0) return null;

    let totalDistance = 0;
    let totalDuration = 0;
    let totalIdleTime = 0;
    let speedingEvents = 0;
    let harshBrakingEvents = 0;
    let harshAccelerationEvents = 0;
    let corneringEvents = 0;
    let overspeedEvents = 0;
    let longIdleEvents = 0;
    let maxSpeed = 0;
    let speedSum = 0;
    let speedCount = 0;

    for (let i = 1; i < telemetry.length; i++) {
      const prev = telemetry[i - 1];
      const curr = telemetry[i];
      const timeDiff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
      totalDuration += timeDiff;
      totalDistance += curr.distance || 0;

      if (curr.speed != null) {
        speedSum += curr.speed;
        speedCount++;
        if (curr.speed > maxSpeed) maxSpeed = curr.speed;
      }

      if (curr.harshBraking) harshBrakingEvents++;
      if (curr.harshAcceleration) harshAccelerationEvents++;
      if (curr.sharpCornering) corneringEvents++;
      if (curr.overspeed) overspeedEvents++;
      if (curr.idleTime && curr.idleTime > 15) longIdleEvents++;
      if (curr.idleTime) totalIdleTime += curr.idleTime;
    }

    const avgSpeed = speedCount > 0 ? speedSum / speedCount : 0;

    // Calculate safety score (0-100)
    const safetyScore = Math.max(0, 100 - (harshBrakingEvents * 5 + harshAccelerationEvents * 4 + corneringEvents * 3 + overspeedEvents * 2));
    const aggressiveScore = Math.max(0, 100 - (harshBrakingEvents * 8 + harshAccelerationEvents * 8 + corneringEvents * 6));
    const efficiencyScore = Math.max(0, 100 - (longIdleEvents * 3 + (avgSpeed > 0 ? totalIdleTime / avgSpeed * 2 : 0)));

    return {
      totalTrips: 0, // Would need trip data
      totalDistance,
      totalDuration: Math.floor(totalDuration / 60),
      totalIdleTime: Math.floor(totalIdleTime),
      safetyScore,
      aggressiveScore,
      efficiencyScore,
      speedingEvents,
      harshBrakingEvents,
      harshAccelerationEvents,
      corneringEvents,
      overspeedEvents,
      longIdleEvents,
      avgSpeed,
      maxSpeed,
    };
  }
}

export const behaviorService = new BehaviorService();
