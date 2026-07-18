import { alertRepository } from '../repositories/alert.repository';
import { CreateAlertInput, AlertSearchInput, ResolveAlertInput } from '../validators/alert.validator';
import { NotFoundError, BadRequestError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class AlertService {
  async getAll(companyId: string, search: AlertSearchInput) {
    const where: Prisma.VehicleAlertWhereInput = {};
    if (search.q) {
      where.OR = [
        { message: { contains: search.q, mode: 'insensitive' } },
        { value: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.alertType) where.alertType = search.alertType;
    if (search.severity) where.severity = search.severity;
    if (search.status) where.status = search.status;
    if (search.vehicleId) where.vehicleId = search.vehicleId;

    const result = await alertRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
      orderBy: { [search.sortBy]: search.sortOrder } as any,
    });

    return { ...result, page: search.page, limit: search.limit, totalPages: Math.ceil(result.total / search.limit) };
  }

  async getById(id: string, companyId: string) {
    const alert = await alertRepository.findById(id, companyId);
    if (!alert) throw new NotFoundError('Alert not found');
    return alert;
  }

  async create(companyId: string, data: CreateAlertInput, createdById: string) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, companyId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const alert = await alertRepository.create({
      ...data,
      company: { connect: { id: companyId } },
      vehicle: { connect: { id: data.vehicleId } },
      ...(data.driverId && { driver: { connect: { id: data.driverId } } }),
      metadata: data.metadata as any,
    } as Prisma.VehicleAlertCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'CREATE',
      entityType: 'VehicleAlert',
      entityId: alert.id,
      description: `Alert ${data.alertType} created for vehicle ${data.vehicleId}`,
    });

    return alert;
  }

  async acknowledge(id: string, companyId: string, userId: string) {
    const alert = await alertRepository.findById(id, companyId);
    if (!alert) throw new NotFoundError('Alert not found');
    if (alert.status === 'RESOLVED' || alert.status === 'DISMISSED') throw new BadRequestError('Alert already resolved');

    await alertRepository.acknowledge(id, companyId, userId);
    await authRepository.createAuditLog({
      companyId,
      userId,
      action: 'APPROVE',
      entityType: 'VehicleAlert',
      entityId: id,
      description: `Alert ${alert.alertType} acknowledged`,
    });
    return { message: 'Alert acknowledged' };
  }

  async resolve(id: string, companyId: string, userId: string, data?: ResolveAlertInput) {
    const alert = await alertRepository.findById(id, companyId);
    if (!alert) throw new NotFoundError('Alert not found');
    if (alert.status === 'DISMISSED') throw new BadRequestError('Alert already dismissed');

    await alertRepository.resolve(id, companyId, userId, data?.resolutionNotes);
    await authRepository.createAuditLog({
      companyId,
      userId,
      action: 'APPROVE',
      entityType: 'VehicleAlert',
      entityId: id,
      description: `Alert ${alert.alertType} resolved`,
    });
    return { message: 'Alert resolved' };
  }

  async dismiss(id: string, companyId: string, userId: string) {
    const alert = await alertRepository.findById(id, companyId);
    if (!alert) throw new NotFoundError('Alert not found');

    await alertRepository.dismiss(id, companyId, userId);
    await authRepository.createAuditLog({
      companyId,
      userId,
      action: 'REJECT',
      entityType: 'VehicleAlert',
      entityId: id,
      description: `Alert ${alert.alertType} dismissed`,
    });
    return { message: 'Alert dismissed' };
  }

  async generateFromTelemetry(companyId: string, vehicleId: string, driverId: string | null, telemetry: { speed: number | null; batteryVoltage: number | null; ignition: boolean | null; timestamp: Date }) {
    const alerts = [];

    // Overspeed
    if (telemetry.speed != null && telemetry.speed > 100) {
      alerts.push({ alertType: 'OVERSPEED', severity: 'HIGH', value: `${telemetry.speed} km/h`, message: `Vehicle exceeded speed limit: ${telemetry.speed} km/h` });
    }

    // Low battery
    if (telemetry.batteryVoltage != null && telemetry.batteryVoltage < 11.5) {
      alerts.push({ alertType: 'LOW_BATTERY', severity: 'MEDIUM', value: `${telemetry.batteryVoltage}V`, message: `Low battery voltage detected: ${telemetry.batteryVoltage}V` });
    }

    // Idle
    if (telemetry.ignition && telemetry.speed != null && telemetry.speed < 1) {
      alerts.push({ alertType: 'IDLE', severity: 'LOW', message: 'Vehicle idle with ignition on' });
    }

    return alerts;
  }

  async processBatchAlerts(companyId: string, createdById: string, alerts: { vehicleId: string; driverId?: string | null; alertType: string; severity: string; latitude?: number; longitude?: number; speed?: number; value?: string; message?: string }[]) {
    const created = [];
    for (const alertData of alerts) {
      try {
        const alert = await alertRepository.create({
          company: { connect: { id: companyId } },
          vehicle: { connect: { id: alertData.vehicleId } },
          ...(alertData.driverId && { driver: { connect: { id: alertData.driverId } } }),
          alertType: alertData.alertType,
          severity: alertData.severity,
          latitude: alertData.latitude,
          longitude: alertData.longitude,
          speed: alertData.speed,
          value: alertData.value,
          message: alertData.message,
        } as Prisma.VehicleAlertCreateInput);
        created.push(alert);
      } catch {
        // Skip failed alerts
      }
    }
    return created;
  }
}

export const alertService = new AlertService();
