import { fuelLogRepository } from '../repositories/fuel-log.repository';
import {
  CreateFuelLogInput,
  UpdateFuelLogInput,
  FuelLogSearchInput,
} from '../validators/fuel-log.validator';
import { NotFoundError, BadRequestError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { fuelCardService } from '@/modules/fuel-card/services/fuel-card.service';
import { fuelFraudService } from '@/modules/fuel-fraud/services/fuel-fraud.service';

export class FuelLogService {
  async getAll(companyId: string, search: FuelLogSearchInput) {
    const where: Prisma.FuelLogWhereInput = { deletedAt: null };
    if (search.q) {
      where.OR = [
        { notes: { contains: search.q, mode: 'insensitive' } },
        { vehicle: { registrationNumber: { contains: search.q, mode: 'insensitive' } } },
      ];
    }
    if (search.vehicleId) where.vehicleId = search.vehicleId;
    if (search.driverId) where.driverId = search.driverId;
    if (search.fuelType) where.fuelType = search.fuelType as any;
    if (search.status) where.status = search.status as any;
    if (search.paymentMethod) where.paymentMethod = search.paymentMethod as any;
    if (search.fuelCardId) where.fuelCardId = search.fuelCardId;
    if (search.dateFrom || search.dateTo) {
      where.fuelDate = {};
      if (search.dateFrom) where.fuelDate.gte = new Date(search.dateFrom);
      if (search.dateTo) where.fuelDate.lte = new Date(search.dateTo);
    }

    const result = await fuelLogRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
      orderBy: { [search.sortBy]: search.sortOrder } as any,
    });

    return {
      ...result,
      page: search.page,
      limit: search.limit,
      totalPages: Math.ceil(result.total / search.limit),
    };
  }

  async getById(id: string, companyId: string) {
    const log = await fuelLogRepository.findById(id, companyId);
    if (!log) throw new NotFoundError('Fuel log not found');
    return log;
  }

  async create(companyId: string, data: CreateFuelLogInput, createdById: string) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, companyId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    if (data.driverId) {
      const driver = await prisma.driver.findFirst({
        where: { id: data.driverId, companyId, deletedAt: null },
      });
      if (!driver) throw new NotFoundError('Driver not found');
    }

    if (data.tripId) {
      const trip = await prisma.trip.findFirst({
        where: { id: data.tripId, companyId, deletedAt: null },
      });
      if (!trip) throw new NotFoundError('Trip not found');
    }

    if (data.fuelStationId) {
      const station = await prisma.fuelStation.findFirst({
        where: { id: data.fuelStationId, companyId, deletedAt: null },
      });
      if (!station) throw new NotFoundError('Fuel station not found');
    }

    if (data.supplierId) {
      const supplier = await prisma.fuelSupplier.findFirst({
        where: { id: data.supplierId, companyId, deletedAt: null },
      });
      if (!supplier) throw new NotFoundError('Fuel supplier not found');
    }

    // Fuel card limit check
    if (data.fuelCardId && data.paymentMethod === 'FUEL_CARD') {
      await fuelCardService.checkLimits(data.fuelCardId, data.totalCost, new Date(data.fuelDate));
    }

    const fuelDate = new Date(data.fuelDate);

    // Calculate consumption
    const previousLog = await fuelLogRepository.findPreviousLog(data.vehicleId, fuelDate, companyId);
    let previousOdometerReading: number | null = null;
    let distanceSinceLastRefuel: number | null = null;
    let consumptionRate: number | null = null;
    let costPerKm: number | null = null;

    if (data.odometerReading && previousLog?.odometerReading) {
      previousOdometerReading = previousLog.odometerReading;
      distanceSinceLastRefuel = data.odometerReading - previousLog.odometerReading;
      if (distanceSinceLastRefuel > 0) {
        consumptionRate = distanceSinceLastRefuel / data.quantity;
        costPerKm = data.totalCost / distanceSinceLastRefuel;
      }
    }

    const log = await fuelLogRepository.create({
      ...data,
      fuelDate,
      previousOdometerReading,
      distanceSinceLastRefuel,
      consumptionRate,
      costPerKm,
      company: { connect: { id: companyId } },
      vehicle: { connect: { id: data.vehicleId } },
      ...(data.driverId && { driver: { connect: { id: data.driverId } } }),
      ...(data.tripId && { trip: { connect: { id: data.tripId } } }),
      ...(data.fuelStationId && { fuelStation: { connect: { id: data.fuelStationId } } }),
      ...(data.supplierId && { supplier: { connect: { id: data.supplierId } } }),
      ...(data.fuelCardId && { fuelCard: { connect: { id: data.fuelCardId } } }),
    } as Prisma.FuelLogCreateInput);

    // Record fuel card transaction if applicable
    if (data.fuelCardId && data.paymentMethod === 'FUEL_CARD') {
      await fuelCardService.recordTransaction(data.fuelCardId, companyId, {
        fuelLogId: log.id,
        amount: data.totalCost,
        currency: data.currency,
        transactionType: 'FUEL_PURCHASE',
      });
    }

    // Update stats
    await this.updateVehicleStats(data.vehicleId, companyId);
    if (data.driverId) {
      await this.updateDriverStats(data.driverId, companyId);
    }

    // Run fraud detection
    await fuelFraudService.detectFraud(log.id, companyId);

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'CREATE',
      entityType: 'FuelLog',
      entityId: log.id,
      description: `Fuel log created for vehicle ${vehicle.registrationNumber}`,
    });

    return fuelLogRepository.findById(log.id, companyId);
  }

  async update(id: string, companyId: string, data: UpdateFuelLogInput, updatedById: string) {
    const existing = await fuelLogRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Fuel log not found');

    const vehicleId = data.vehicleId || existing.vehicleId;

    const updateData: Prisma.FuelLogUpdateInput = { ...data };
    if (data.fuelDate) updateData.fuelDate = new Date(data.fuelDate);

    // Recalculate if odometer or quantity changed
    if (data.odometerReading || data.quantity || data.totalCost || data.fuelDate) {
      const fuelDate = data.fuelDate ? new Date(data.fuelDate) : existing.fuelDate;
      const previousLog = await fuelLogRepository.findPreviousLog(vehicleId, fuelDate, companyId);
      const odometer = data.odometerReading ?? existing.odometerReading ?? null;

      if (odometer && previousLog?.odometerReading) {
        const distance = odometer - previousLog.odometerReading;
        const quantity = data.quantity ?? existing.quantity;
        const totalCost = data.totalCost ?? existing.totalCost;
        updateData.previousOdometerReading = previousLog.odometerReading;
        updateData.distanceSinceLastRefuel = distance > 0 ? distance : null;
        updateData.consumptionRate = distance > 0 ? distance / quantity : null;
        updateData.costPerKm = distance > 0 ? totalCost / distance : null;
      }
    }

    await fuelLogRepository.update(id, companyId, updateData);

    // Recalculate stats for affected vehicle and driver
    await this.updateVehicleStats(existing.vehicleId, companyId);
    if (existing.driverId) {
      await this.updateDriverStats(existing.driverId, companyId);
    }
    if (data.vehicleId && data.vehicleId !== existing.vehicleId) {
      await this.updateVehicleStats(data.vehicleId, companyId);
    }
    if (data.driverId && data.driverId !== existing.driverId) {
      await this.updateDriverStats(data.driverId, companyId);
    }

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'UPDATE',
      entityType: 'FuelLog',
      entityId: id,
      description: `Fuel log updated for vehicle ${vehicleId}`,
    });

    return fuelLogRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string, deletedById: string) {
    const log = await fuelLogRepository.findById(id, companyId);
    if (!log) throw new NotFoundError('Fuel log not found');

    await fuelLogRepository.delete(id, companyId);

    await this.updateVehicleStats(log.vehicleId, companyId);
    if (log.driverId) {
      await this.updateDriverStats(log.driverId, companyId);
    }

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'DELETE',
      entityType: 'FuelLog',
      entityId: id,
      description: `Fuel log deleted for vehicle ${log.vehicleId}`,
    });

    return { message: 'Fuel log deleted' };
  }

  async bulkImport(companyId: string, logs: CreateFuelLogInput[], createdById: string) {
    const created = [];
    const errors = [];
    for (const logData of logs) {
      try {
        const log = await this.create(companyId, logData, createdById);
        created.push(log);
      } catch (error: any) {
        errors.push({ log: logData, error: error.message });
      }
    }
    return { created: created.length, errors, createdLogs: created };
  }

  async updateVehicleStats(vehicleId: string, companyId: string) {
    const logs = await prisma.fuelLog.findMany({
      where: { vehicleId, companyId, deletedAt: null },
      orderBy: { fuelDate: 'asc' },
    });

    const totalFuelConsumed = logs.reduce((sum, l) => sum + l.quantity, 0);
    const totalFuelCost = logs.reduce((sum, l) => sum + l.totalCost, 0);
    const firstLog = logs[0];
    const lastLog = logs[logs.length - 1];
    const totalDistance = firstLog && lastLog?.odometerReading && firstLog.odometerReading
      ? lastLog.odometerReading - firstLog.odometerReading
      : 0;

    const averageConsumption = totalFuelConsumed > 0 && totalDistance > 0
      ? totalDistance / totalFuelConsumed
      : null;
    const averageCostPerKm = totalDistance > 0
      ? totalFuelCost / totalDistance
      : null;

    await prisma.vehicleFuelStats.upsert({
      where: { vehicleId },
      create: {
        vehicleId,
        companyId,
        totalFuelConsumed,
        totalFuelCost,
        totalDistance,
        averageConsumption,
        averageCostPerKm,
        lastRefuelDate: lastLog?.fuelDate || null,
        lastOdometerReading: lastLog?.odometerReading || null,
      },
      update: {
        totalFuelConsumed,
        totalFuelCost,
        totalDistance,
        averageConsumption,
        averageCostPerKm,
        lastRefuelDate: lastLog?.fuelDate || null,
        lastOdometerReading: lastLog?.odometerReading || null,
      },
    });
  }

  async updateDriverStats(driverId: string, companyId: string) {
    const logs = await prisma.fuelLog.findMany({
      where: { driverId, companyId, deletedAt: null },
      orderBy: { fuelDate: 'asc' },
    });

    const totalFuelConsumed = logs.reduce((sum, l) => sum + l.quantity, 0);
    const totalFuelCost = logs.reduce((sum, l) => sum + l.totalCost, 0);
    const firstLog = logs[0];
    const lastLog = logs[logs.length - 1];
    const totalDistance = firstLog && lastLog?.odometerReading && firstLog.odometerReading
      ? lastLog.odometerReading - firstLog.odometerReading
      : 0;

    const averageConsumption = totalFuelConsumed > 0 && totalDistance > 0
      ? totalDistance / totalFuelConsumed
      : null;
    const averageCostPerKm = totalDistance > 0
      ? totalFuelCost / totalDistance
      : null;

    await prisma.driverFuelStats.upsert({
      where: { driverId },
      create: {
        driverId,
        companyId,
        totalFuelConsumed,
        totalFuelCost,
        totalDistance,
        averageConsumption,
        averageCostPerKm,
        refuelCount: logs.length,
      },
      update: {
        totalFuelConsumed,
        totalFuelCost,
        totalDistance,
        averageConsumption,
        averageCostPerKm,
        refuelCount: logs.length,
      },
    });
  }
}

export const fuelLogService = new FuelLogService();
