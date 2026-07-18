import { maintenanceRecordRepository } from '../repositories/maintenance-record.repository';
import {
  CreateMaintenanceRecordInput,
  UpdateMaintenanceRecordInput,
  MaintenanceRecordSearchInput,
  MaintenanceCostInput,
} from '../validators/maintenance-record.validator';
import { NotFoundError, ConflictError } from '@/shared/errors/AppError';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class MaintenanceRecordService {
  async getAll(companyId: string, search: MaintenanceRecordSearchInput) {
    const where: Prisma.MaintenanceRecordWhereInput = { deletedAt: null };
    if (search.q) {
      where.OR = [
        { description: { contains: search.q, mode: 'insensitive' } },
        { serviceNumber: { contains: search.q, mode: 'insensitive' } },
        { vehicle: { registrationNumber: { contains: search.q, mode: 'insensitive' } } },
      ];
    }
    if (search.vehicleId) where.vehicleId = search.vehicleId;
    if (search.status) where.status = search.status as any;
    if (search.priority) where.priority = search.priority as any;
    if (search.serviceCenterId) where.serviceCenterId = search.serviceCenterId;
    if (search.startDate || search.endDate) {
      where.serviceDate = {};
      if (search.startDate) where.serviceDate.gte = new Date(search.startDate);
      if (search.endDate) where.serviceDate.lte = new Date(search.endDate);
    }

    const result = await maintenanceRecordRepository.findAll(companyId, {
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
    const record = await maintenanceRecordRepository.findById(id, companyId);
    if (!record) throw new NotFoundError('Maintenance record not found');
    return record;
  }

  async create(companyId: string, data: CreateMaintenanceRecordInput) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, companyId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    if (data.serviceNumber) {
      const existing = await prisma.maintenanceRecord.findFirst({
        where: { serviceNumber: data.serviceNumber, companyId, deletedAt: null },
      });
      if (existing) throw new ConflictError('Service number already exists');
    }

    if (data.scheduleId) {
      const schedule = await prisma.maintenanceSchedule.findFirst({
        where: { id: data.scheduleId, companyId, deletedAt: null },
      });
      if (!schedule) throw new NotFoundError('Maintenance schedule not found');
    }

    if (data.serviceCenterId) {
      const center = await prisma.serviceCenter.findFirst({
        where: { id: data.serviceCenterId, companyId, deletedAt: null },
      });
      if (!center) throw new NotFoundError('Service center not found');
    }

    if (data.mechanicId) {
      const mechanic = await prisma.mechanic.findFirst({
        where: { id: data.mechanicId, companyId, deletedAt: null },
      });
      if (!mechanic) throw new NotFoundError('Mechanic not found');
    }

    const createData: Prisma.MaintenanceRecordCreateInput = {
      ...data,
      company: { connect: { id: companyId } },
      vehicle: { connect: { id: data.vehicleId } },
      ...(data.scheduleId ? { schedule: { connect: { id: data.scheduleId } } } : {}),
      ...(data.serviceCenterId ? { serviceCenter: { connect: { id: data.serviceCenterId } } } : {}),
      ...(data.mechanicId ? { mechanic: { connect: { id: data.mechanicId } } } : {}),
    };

    return maintenanceRecordRepository.create(createData);
  }

  async update(id: string, companyId: string, data: UpdateMaintenanceRecordInput) {
    const record = await maintenanceRecordRepository.findById(id, companyId);
    if (!record) throw new NotFoundError('Maintenance record not found');

    if (data.serviceNumber && data.serviceNumber !== record.serviceNumber) {
      const existing = await prisma.maintenanceRecord.findFirst({
        where: { serviceNumber: data.serviceNumber, companyId, deletedAt: null },
      });
      if (existing) throw new ConflictError('Service number already exists');
    }

    const updateData: Prisma.MaintenanceRecordUpdateInput = { ...data };
    if (data.vehicleId) updateData.vehicle = { connect: { id: data.vehicleId } };
    if (data.scheduleId) updateData.schedule = { connect: { id: data.scheduleId } };
    if (data.serviceCenterId) updateData.serviceCenter = { connect: { id: data.serviceCenterId } };
    if (data.mechanicId) updateData.mechanic = { connect: { id: data.mechanicId } };

    await maintenanceRecordRepository.update(id, companyId, updateData);
    return maintenanceRecordRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    const record = await maintenanceRecordRepository.findById(id, companyId);
    if (!record) throw new NotFoundError('Maintenance record not found');
    await maintenanceRecordRepository.delete(id, companyId);
    return { id, deleted: true };
  }

  async addCost(id: string, companyId: string, data: MaintenanceCostInput) {
    const record = await maintenanceRecordRepository.findById(id, companyId);
    if (!record) throw new NotFoundError('Maintenance record not found');

    return prisma.maintenanceCost.create({
      data: {
        ...data,
        company: { connect: { id: companyId } },
        maintenanceRecord: { connect: { id } },
      },
    });
  }
}

export const maintenanceRecordService = new MaintenanceRecordService();
