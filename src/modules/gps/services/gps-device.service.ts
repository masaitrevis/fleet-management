import { gpsDeviceRepository } from '../repositories/gps-device.repository';
import {
  CreateGPSDeviceInput,
  UpdateGPSDeviceInput,
  GPSDeviceSearchInput,
  AssignVehicleInput,
  ReplaceDeviceInput,
} from '../validators/gps-device.validator';
import { NotFoundError, ConflictError, BadRequestError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { Prisma } from '@prisma/client';

export class GPSDeviceService {
  async getAll(companyId: string, search: GPSDeviceSearchInput) {
    const where: Prisma.GPSDeviceWhereInput = {};
    if (search.q) {
      where.OR = [
        { deviceId: { contains: search.q, mode: 'insensitive' } },
        { serialNumber: { contains: search.q, mode: 'insensitive' } },
        { imei: { contains: search.q, mode: 'insensitive' } },
        { model: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.status) where.status = search.status as any;
    if (search.manufacturer) where.manufacturer = search.manufacturer;

    const result = await gpsDeviceRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
      orderBy: { [search.sortBy]: search.sortOrder } as any,
    });

    return { ...result, page: search.page, limit: search.limit, totalPages: Math.ceil(result.total / search.limit) };
  }

  async getById(id: string, companyId: string) {
    const device = await gpsDeviceRepository.findById(id, companyId);
    if (!device) throw new NotFoundError('GPS device not found');
    return device;
  }

  async create(companyId: string, data: CreateGPSDeviceInput, createdById: string) {
    if (data.imei) {
      const existing = await gpsDeviceRepository.findByImei(companyId, data.imei);
      if (existing) throw new ConflictError('GPS device with this IMEI already exists');
    }
    const existingDeviceId = await gpsDeviceRepository.findByDeviceId(companyId, data.deviceId);
    if (existingDeviceId) throw new ConflictError('GPS device with this device ID already exists');

    const device = await gpsDeviceRepository.create({
      ...data,
      company: { connect: { id: companyId } },
    } as Prisma.GPSDeviceCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'CREATE',
      entityType: 'GPSDevice',
      entityId: device.id,
      description: `GPS device ${data.deviceId} created`,
    });

    return gpsDeviceRepository.findById(device.id, companyId);
  }

  async update(id: string, companyId: string, data: UpdateGPSDeviceInput, updatedById: string) {
    const existing = await gpsDeviceRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('GPS device not found');

    const updateData: Prisma.GPSDeviceUpdateInput = {};
    const simpleFields: (keyof UpdateGPSDeviceInput)[] = [
      'deviceId', 'serialNumber', 'imei', 'simNumber', 'simProvider',
      'manufacturer', 'model', 'firmwareVersion', 'status',
      'batteryLevel', 'signalStrength', 'networkType',
    ];
    for (const field of simpleFields) {
      if (data[field] !== undefined) (updateData as any)[field] = data[field];
    }

    await gpsDeviceRepository.update(id, companyId, updateData);

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'UPDATE',
      entityType: 'GPSDevice',
      entityId: id,
      description: `GPS device ${existing.deviceId} updated`,
    });

    return gpsDeviceRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string, deletedById: string) {
    const existing = await gpsDeviceRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('GPS device not found');

    await gpsDeviceRepository.softDelete(id, companyId);

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'DELETE',
      entityType: 'GPSDevice',
      entityId: id,
      description: `GPS device ${existing.deviceId} deleted`,
    });

    return { message: 'GPS device deleted successfully' };
  }

  async activate(id: string, companyId: string, activatedById: string) {
    const existing = await gpsDeviceRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('GPS device not found');
    await gpsDeviceRepository.update(id, companyId, { status: 'ACTIVE' });

    await authRepository.createAuditLog({
      companyId,
      userId: activatedById,
      action: 'ACTIVATE',
      entityType: 'GPSDevice',
      entityId: id,
      description: `GPS device ${existing.deviceId} activated`,
    });

    return { message: 'GPS device activated' };
  }

  async deactivate(id: string, companyId: string, deactivatedById: string) {
    const existing = await gpsDeviceRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('GPS device not found');
    await gpsDeviceRepository.update(id, companyId, { status: 'INACTIVE' });

    await authRepository.createAuditLog({
      companyId,
      userId: deactivatedById,
      action: 'DEACTIVATE',
      entityType: 'GPSDevice',
      entityId: id,
      description: `GPS device ${existing.deviceId} deactivated`,
    });

    return { message: 'GPS device deactivated' };
  }

  async assignVehicle(id: string, companyId: string, data: AssignVehicleInput, assignedById: string) {
    const existing = await gpsDeviceRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('GPS device not found');

    // Unassign any existing device on this vehicle first
    const existingDevice = await gpsDeviceRepository.findByVehicle(data.vehicleId);
    if (existingDevice) {
      await gpsDeviceRepository.update(existingDevice.id, companyId, { vehicle: { disconnect: { id: data.vehicleId } } });
    }

    await gpsDeviceRepository.update(id, companyId, {
      vehicle: { connect: { id: data.vehicleId } },
    });

    await authRepository.createAuditLog({
      companyId,
      userId: assignedById,
      action: 'ASSIGN',
      entityType: 'GPSDevice',
      entityId: id,
      description: `GPS device assigned to vehicle ${data.vehicleId}`,
    });

    return { message: 'GPS device assigned to vehicle successfully' };
  }

  async replaceDevice(id: string, companyId: string, data: ReplaceDeviceInput, replacedById: string) {
    const existing = await gpsDeviceRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('GPS device not found');
    const newDevice = await gpsDeviceRepository.findById(data.newDeviceId, companyId);
    if (!newDevice) throw new NotFoundError('New GPS device not found');

    const vehicleId = existing.vehicle?.[0]?.id;
    if (vehicleId) {
      await gpsDeviceRepository.update(id, companyId, { vehicle: { disconnect: { id: vehicleId } } });
      await gpsDeviceRepository.update(data.newDeviceId, companyId, { vehicle: { connect: { id: vehicleId } } });
    }

    await gpsDeviceRepository.update(id, companyId, { status: 'DECOMMISSIONED' });
    await gpsDeviceRepository.update(data.newDeviceId, companyId, { status: 'ACTIVE' });

    await authRepository.createAuditLog({
      companyId,
      userId: replacedById,
      action: 'REPLACE',
      entityType: 'GPSDevice',
      entityId: id,
      description: `GPS device replaced with ${data.newDeviceId}`,
    });

    return { message: 'GPS device replaced successfully' };
  }

  async getDiagnostics(id: string, companyId: string) {
    const device = await gpsDeviceRepository.findById(id, companyId);
    if (!device) throw new NotFoundError('GPS device not found');
    return {
      device,
      lastSeenMinutes: device.lastSeenAt ? Math.floor((Date.now() - new Date(device.lastSeenAt).getTime()) / 60000) : null,
      lastLocationMinutes: device.lastLocationAt ? Math.floor((Date.now() - new Date(device.lastLocationAt).getTime()) / 60000) : null,
      isOnline: device.lastSeenAt ? (Date.now() - new Date(device.lastSeenAt).getTime()) < 300000 : false,
    };
  }

  async getFilters(companyId: string) {
    return gpsDeviceRepository.getFilterOptions(companyId);
  }
}

export const gpsDeviceService = new GPSDeviceService();
