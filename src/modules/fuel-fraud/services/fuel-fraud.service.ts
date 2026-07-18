import { fuelFraudRepository } from '../repositories/fuel-fraud.repository';
import { UpdateFraudStatusInput, FuelFraudSearchInput } from '../validators/fuel-fraud.validator';
import { NotFoundError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class FuelFraudService {
  async getAll(companyId: string, search: FuelFraudSearchInput) {
    const where: Prisma.FuelFraudAlertWhereInput = {};
    if (search.status) where.status = search.status as any;
    if (search.fraudType) where.fraudType = search.fraudType as any;
    if (search.vehicleId) where.vehicleId = search.vehicleId;

    const result = await fuelFraudRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
      orderBy: { [search.sortBy]: search.sortOrder } as any,
    });

    return { ...result, page: search.page, limit: search.limit, totalPages: Math.ceil(result.total / search.limit) };
  }

  async getById(id: string, companyId: string) {
    const alert = await fuelFraudRepository.findById(id, companyId);
    if (!alert) throw new NotFoundError('Fraud alert not found');
    return alert;
  }

  async updateStatus(id: string, companyId: string, data: UpdateFraudStatusInput, updatedById: string) {
    const existing = await fuelFraudRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Fraud alert not found');

    await fuelFraudRepository.update(id, companyId, {
      status: data.status as any,
      description: data.description,
      resolvedAt: data.status === 'CONFIRMED' || data.status === 'FALSE_POSITIVE' || data.status === 'DISMISSED' ? new Date() : undefined,
      resolvedBy: data.status === 'CONFIRMED' || data.status === 'FALSE_POSITIVE' || data.status === 'DISMISSED' ? updatedById : undefined,
    });

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'UPDATE',
      entityType: 'FuelFraudAlert',
      entityId: id,
      description: `Fraud alert status changed to ${data.status}`,
    });

    return fuelFraudRepository.findById(id, companyId);
  }

  async detectFraud(fuelLogId: string, companyId: string) {
    const fuelLog = await prisma.fuelLog.findFirst({
      where: { id: fuelLogId, companyId, deletedAt: null },
      include: { vehicle: true },
    });
    if (!fuelLog || !fuelLog.odometerReading) return;

    const alerts = [];

    // Duplicate: Same vehicle, same odometer, within 1 hour
    const oneHourAgo = new Date(fuelLog.fuelDate.getTime() - 60 * 60 * 1000);
    const oneHourLater = new Date(fuelLog.fuelDate.getTime() + 60 * 60 * 1000);
    const duplicate = await prisma.fuelLog.findFirst({
      where: {
        vehicleId: fuelLog.vehicleId,
        companyId,
        deletedAt: null,
        id: { not: fuelLogId },
        odometerReading: fuelLog.odometerReading,
        fuelDate: { gte: oneHourAgo, lte: oneHourLater },
      },
    });
    if (duplicate) {
      alerts.push({
        fuelLogId,
        vehicleId: fuelLog.vehicleId,
        driverId: fuelLog.driverId,
        fraudType: 'DUPLICATE_ENTRY' as any,
        confidenceScore: 95,
        description: 'Duplicate fuel log with same odometer reading within 1 hour',
      });
    }

    // Odometer rollback
    const previousLog = await prisma.fuelLog.findFirst({
      where: { vehicleId: fuelLog.vehicleId, companyId, deletedAt: null, fuelDate: { lt: fuelLog.fuelDate } },
      orderBy: { fuelDate: 'desc' },
    });
    if (previousLog && previousLog.odometerReading && fuelLog.odometerReading < previousLog.odometerReading) {
      alerts.push({
        fuelLogId,
        vehicleId: fuelLog.vehicleId,
        driverId: fuelLog.driverId,
        fraudType: 'ODOMETER_ROLLBACK' as any,
        confidenceScore: 98,
        description: `Odometer reading decreased from ${previousLog.odometerReading} to ${fuelLog.odometerReading}`,
      });
    }

    // Tank overflow
    if (fuelLog.vehicle?.fuelTankCapacity && fuelLog.quantity > fuelLog.vehicle.fuelTankCapacity) {
      alerts.push({
        fuelLogId,
        vehicleId: fuelLog.vehicleId,
        driverId: fuelLog.driverId,
        fraudType: 'TANK_OVERFLOW' as any,
        confidenceScore: 90,
        description: `Fuel quantity ${fuelLog.quantity} exceeds tank capacity ${fuelLog.vehicle.fuelTankCapacity}`,
      });
    }

    // Excessive frequency: More than 3 refuels in 24 hours
    const twentyFourHoursAgo = new Date(fuelLog.fuelDate.getTime() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.fuelLog.count({
      where: {
        vehicleId: fuelLog.vehicleId,
        companyId,
        deletedAt: null,
        fuelDate: { gte: twentyFourHoursAgo },
      },
    });
    if (recentCount > 3) {
      alerts.push({
        fuelLogId,
        vehicleId: fuelLog.vehicleId,
        driverId: fuelLog.driverId,
        fraudType: 'EXCESSIVE_FREQUENCY' as any,
        confidenceScore: 75,
        description: `${recentCount} refuels in the last 24 hours`,
      });
    }

    // Off-hours: refuel between 22:00-05:00
    const hour = fuelLog.fuelDate.getHours();
    if (hour >= 22 || hour < 5) {
      alerts.push({
        fuelLogId,
        vehicleId: fuelLog.vehicleId,
        driverId: fuelLog.driverId,
        fraudType: 'OFF_HOURS_REFUEL' as any,
        confidenceScore: 50,
        description: 'Fuel log recorded during off-hours (22:00-05:00)',
      });
    }

    // Create all alerts
    for (const alert of alerts) {
      await fuelFraudRepository.create({
        ...alert,
        status: 'OPEN' as any,
        detectedAt: new Date(),
        company: { connect: { id: companyId } },
        fuelLog: { connect: { id: fuelLogId } },
        vehicle: { connect: { id: fuelLog.vehicleId } },
        ...(fuelLog.driverId && { driver: { connect: { id: fuelLog.driverId } } }),
      } as Prisma.FuelFraudAlertCreateInput);
    }
  }

  async getStats(companyId: string) {
    const [byStatus, byType, totalOpen] = await Promise.all([
      prisma.fuelFraudAlert.groupBy({ by: ['status'], where: { companyId, deletedAt: null }, _count: true }),
      prisma.fuelFraudAlert.groupBy({ by: ['fraudType'], where: { companyId, deletedAt: null }, _count: true }),
      prisma.fuelFraudAlert.count({ where: { companyId, deletedAt: null, status: 'OPEN' as any } }),
    ]);
    return { byStatus, byType, totalOpen };
  }
}

export const fuelFraudService = new FuelFraudService();
