import { vehicleDowntimeRepository } from '../repositories/vehicle-downtime.repository';
import {
  CreateVehicleDowntimeInput,
  UpdateVehicleDowntimeInput,
  VehicleDowntimeSearchInput,
} from '../validators/vehicle-downtime.validator';
import { NotFoundError, BadRequestError } from '@/shared/errors/AppError';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class VehicleDowntimeService {
  async getAll(companyId: string, search: VehicleDowntimeSearchInput) {
    const where: Prisma.VehicleDowntimeWhereInput = { deletedAt: null };
    if (search.vehicleId) where.vehicleId = search.vehicleId;
    if (search.reason) where.reason = search.reason as any;
    if (search.startDate || search.endDate) {
      where.startDate = {};
      if (search.startDate) where.startDate.gte = new Date(search.startDate);
      if (search.endDate) where.startDate.lte = new Date(search.endDate);
    }

    const result = await vehicleDowntimeRepository.findAll(companyId, {
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
    const downtime = await vehicleDowntimeRepository.findById(id, companyId);
    if (!downtime) throw new NotFoundError('Vehicle downtime record not found');
    return downtime;
  }

  async create(companyId: string, data: CreateVehicleDowntimeInput) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, companyId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    if (data.workOrderId) {
      const workOrder = await prisma.workOrder.findFirst({
        where: { id: data.workOrderId, companyId, deletedAt: null },
      });
      if (!workOrder) throw new NotFoundError('Work order not found');
    }

    if (data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
      throw new BadRequestError('End date must be after start date');
    }

    let totalHours: number | undefined = undefined;
    if (data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }

    return vehicleDowntimeRepository.create({
      ...data,
      totalHours,
      company: { connect: { id: companyId } },
      vehicle: { connect: { id: data.vehicleId } },
      ...(data.workOrderId ? { workOrder: { connect: { id: data.workOrderId } } } : {}),
    });
  }

  async update(id: string, companyId: string, data: UpdateVehicleDowntimeInput) {
    const downtime = await vehicleDowntimeRepository.findById(id, companyId);
    if (!downtime) throw new NotFoundError('Vehicle downtime record not found');

    const startDate = data.startDate ? new Date(data.startDate) : downtime.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : downtime.endDate;

    if (endDate && startDate && endDate <= startDate) {
      throw new BadRequestError('End date must be after start date');
    }

    let totalHours: number | undefined = undefined;
    if (endDate && startDate) {
      totalHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    }

    const updateData: Prisma.VehicleDowntimeUpdateInput = { ...data };
    if (data.vehicleId) updateData.vehicle = { connect: { id: data.vehicleId } };
    if (data.workOrderId) updateData.workOrder = { connect: { id: data.workOrderId } };
    if (totalHours !== undefined) updateData.totalHours = totalHours;

    await vehicleDowntimeRepository.update(id, companyId, updateData);
    return vehicleDowntimeRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    const downtime = await vehicleDowntimeRepository.findById(id, companyId);
    if (!downtime) throw new NotFoundError('Vehicle downtime record not found');
    await vehicleDowntimeRepository.delete(id, companyId);
    return { id, deleted: true };
  }
}

export const vehicleDowntimeService = new VehicleDowntimeService();
