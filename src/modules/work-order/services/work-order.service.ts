import { workOrderRepository } from '../repositories/work-order.repository';
import {
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
  WorkOrderSearchInput,
  AssignWorkOrderInput,
  ApproveWorkOrderInput,
  UpdateWorkOrderStatusInput,
} from '../validators/work-order.validator';
import { NotFoundError, BadRequestError, ConflictError } from '@/shared/errors/AppError';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class WorkOrderService {
  async getAll(companyId: string, search: WorkOrderSearchInput) {
    const where: Prisma.WorkOrderWhereInput = { deletedAt: null };
    if (search.q) {
      where.OR = [
        { title: { contains: search.q, mode: 'insensitive' } },
        { description: { contains: search.q, mode: 'insensitive' } },
        { workOrderNumber: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.vehicleId) where.vehicleId = search.vehicleId;
    if (search.mechanicId) where.mechanicId = search.mechanicId;
    if (search.status) where.status = search.status as any;
    if (search.jobType) where.jobType = search.jobType as any;
    if (search.priority) where.priority = search.priority as any;
    if (search.startDate || search.endDate) {
      where.scheduledDate = {};
      if (search.startDate) where.scheduledDate.gte = new Date(search.startDate);
      if (search.endDate) where.scheduledDate.lte = new Date(search.endDate);
    }

    const result = await workOrderRepository.findAll(companyId, {
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
    const workOrder = await workOrderRepository.findById(id, companyId);
    if (!workOrder) throw new NotFoundError('Work order not found');
    return workOrder;
  }

  async create(companyId: string, data: CreateWorkOrderInput, createdById: string) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, companyId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    if (data.mechanicId) {
      const mechanic = await prisma.mechanic.findFirst({
        where: { id: data.mechanicId, companyId, deletedAt: null },
      });
      if (!mechanic) throw new NotFoundError('Mechanic not found');
    }

    if (data.serviceCenterId) {
      const center = await prisma.serviceCenter.findFirst({
        where: { id: data.serviceCenterId, companyId, deletedAt: null },
      });
      if (!center) throw new NotFoundError('Service center not found');
    }

    if (data.scheduleId) {
      const schedule = await prisma.maintenanceSchedule.findFirst({
        where: { id: data.scheduleId, companyId, deletedAt: null },
      });
      if (!schedule) throw new NotFoundError('Maintenance schedule not found');
    }

    if (data.serviceTemplateId) {
      const template = await prisma.serviceTemplate.findFirst({
        where: { id: data.serviceTemplateId, companyId, deletedAt: null },
      });
      if (!template) throw new NotFoundError('Service template not found');
    }

    const existing = await prisma.workOrder.findFirst({
      where: { workOrderNumber: data.workOrderNumber, companyId, deletedAt: null },
    });
    if (existing) throw new ConflictError('Work order number already exists');

    const createData: Prisma.WorkOrderCreateInput = {
      ...data,
      company: { connect: { id: companyId } },
      vehicle: { connect: { id: data.vehicleId } },
      ...(data.mechanicId ? { mechanic: { connect: { id: data.mechanicId } } } : {}),
      ...(data.supervisorId ? { supervisor: { connect: { id: data.supervisorId } } } : {}),
      ...(data.serviceCenterId ? { serviceCenter: { connect: { id: data.serviceCenterId } } } : {}),
      ...(data.scheduleId ? { schedule: { connect: { id: data.scheduleId } } } : {}),
      ...(data.serviceTemplateId ? { serviceTemplate: { connect: { id: data.serviceTemplateId } } } : {}),
    };

    return workOrderRepository.create(createData);
  }

  async update(id: string, companyId: string, data: UpdateWorkOrderInput) {
    const workOrder = await workOrderRepository.findById(id, companyId);
    if (!workOrder) throw new NotFoundError('Work order not found');

    if (data.workOrderNumber && data.workOrderNumber !== workOrder.workOrderNumber) {
      const existing = await prisma.workOrder.findFirst({
        where: { workOrderNumber: data.workOrderNumber, companyId, deletedAt: null },
      });
      if (existing) throw new ConflictError('Work order number already exists');
    }

    const updateData: Prisma.WorkOrderUpdateInput = { ...data };

    if (data.vehicleId) updateData.vehicle = { connect: { id: data.vehicleId } };
    if (data.mechanicId) updateData.mechanic = { connect: { id: data.mechanicId } };
    if (data.supervisorId) updateData.supervisor = { connect: { id: data.supervisorId } };
    if (data.serviceCenterId) updateData.serviceCenter = { connect: { id: data.serviceCenterId } };
    if (data.scheduleId) updateData.schedule = { connect: { id: data.scheduleId } };
    if (data.serviceTemplateId) updateData.serviceTemplate = { connect: { id: data.serviceTemplateId } };

    await workOrderRepository.update(id, companyId, updateData);
    return workOrderRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    const workOrder = await workOrderRepository.findById(id, companyId);
    if (!workOrder) throw new NotFoundError('Work order not found');
    await workOrderRepository.delete(id, companyId);
    return { id, deleted: true };
  }

  async assign(id: string, companyId: string, data: AssignWorkOrderInput) {
    const workOrder = await workOrderRepository.findById(id, companyId);
    if (!workOrder) throw new NotFoundError('Work order not found');

    const mechanic = await prisma.mechanic.findFirst({
      where: { id: data.mechanicId, companyId, deletedAt: null },
    });
    if (!mechanic) throw new NotFoundError('Mechanic not found');

    await workOrderRepository.update(id, companyId, {
      mechanic: { connect: { id: data.mechanicId } },
      status: 'ASSIGNED' as any,
    });
    return workOrderRepository.findById(id, companyId);
  }

  async approve(id: string, companyId: string, data: ApproveWorkOrderInput, approvedById: string) {
    const workOrder = await workOrderRepository.findById(id, companyId);
    if (!workOrder) throw new NotFoundError('Work order not found');

    if (workOrder.status !== 'PENDING_APPROVAL' && workOrder.status !== 'DRAFT') {
      throw new BadRequestError('Work order must be in DRAFT or PENDING_APPROVAL status to be approved');
    }

    await workOrderRepository.update(id, companyId, {
      approvalStatus: data.approved ? 'APPROVED' : 'REJECTED',
      approvedBy: data.approved ? approvedById : null,
      approvedAt: data.approved ? new Date() : null,
      status: data.approved ? 'APPROVED' : 'CANCELLED',
    });
    return workOrderRepository.findById(id, companyId);
  }

  async updateStatus(id: string, companyId: string, data: UpdateWorkOrderStatusInput) {
    const workOrder = await workOrderRepository.findById(id, companyId);
    if (!workOrder) throw new NotFoundError('Work order not found');

    const updateData: Prisma.WorkOrderUpdateInput = {
      status: data.status,
      ...(data.actualCost !== undefined ? { actualCost: data.actualCost } : {}),
      ...(data.actualDuration !== undefined ? { actualDuration: data.actualDuration } : {}),
      ...(data.afterPhotos ? { afterPhotos: data.afterPhotos } : {}),
      ...(data.inspectionPassed !== undefined ? { inspectionPassed: data.inspectionPassed } : {}),
      ...(data.notes ? { notes: data.notes } : {}),
    };

    if (data.status === 'COMPLETED') {
      updateData.completionDate = new Date();
    }

    await workOrderRepository.update(id, companyId, updateData);
    return workOrderRepository.findById(id, companyId);
  }
}

export const workOrderService = new WorkOrderService();
