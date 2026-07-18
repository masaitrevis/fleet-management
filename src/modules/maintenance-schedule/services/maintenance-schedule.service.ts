import { maintenanceScheduleRepository } from '../repositories/maintenance-schedule.repository';
import {
  CreateMaintenanceScheduleInput,
  UpdateMaintenanceScheduleInput,
  MaintenanceScheduleSearchInput,
} from '../validators/maintenance-schedule.validator';
import { NotFoundError } from '@/shared/errors/AppError';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class MaintenanceScheduleService {
  async getAll(companyId: string, search: MaintenanceScheduleSearchInput) {
    const where: Prisma.MaintenanceScheduleWhereInput = { deletedAt: null };
    if (search.q) {
      where.OR = [
        { name: { contains: search.q, mode: 'insensitive' } },
        { description: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.vehicleId) where.vehicleId = search.vehicleId;
    if (search.scheduleType) where.scheduleType = search.scheduleType as any;
    if (search.isActive !== undefined) where.isActive = search.isActive === 'true';

    const result = await maintenanceScheduleRepository.findAll(companyId, {
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
    const schedule = await maintenanceScheduleRepository.findById(id, companyId);
    if (!schedule) throw new NotFoundError('Maintenance schedule not found');
    return schedule;
  }

  async create(companyId: string, data: CreateMaintenanceScheduleInput) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, companyId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    return maintenanceScheduleRepository.create({
      ...data,
      company: { connect: { id: companyId } },
      vehicle: { connect: { id: data.vehicleId } },
    });
  }

  async update(id: string, companyId: string, data: UpdateMaintenanceScheduleInput) {
    const schedule = await maintenanceScheduleRepository.findById(id, companyId);
    if (!schedule) throw new NotFoundError('Maintenance schedule not found');

    const updateData: Prisma.MaintenanceScheduleUpdateInput = { ...data };
    if (data.vehicleId) updateData.vehicle = { connect: { id: data.vehicleId } };

    await maintenanceScheduleRepository.update(id, companyId, updateData);
    return maintenanceScheduleRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    const schedule = await maintenanceScheduleRepository.findById(id, companyId);
    if (!schedule) throw new NotFoundError('Maintenance schedule not found');
    await maintenanceScheduleRepository.delete(id, companyId);
    return { id, deleted: true };
  }

  async getOverdue(companyId: string) {
    return maintenanceScheduleRepository.findOverdue(companyId);
  }
}

export const maintenanceScheduleService = new MaintenanceScheduleService();
