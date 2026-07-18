import { shiftRepository } from '../repositories/shift.repository';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { CreateShiftInput, UpdateShiftInput, ShiftSearchInput } from '../validators/shift.validator';
import { NotFoundError, BadRequestError } from '@/shared/errors/AppError';
import { Prisma } from '@prisma/client';

export class ShiftService {
  async getAll(companyId: string, search: ShiftSearchInput) {
    const where: Prisma.ShiftWhereInput = {};
    if (search.q) {
      where.name = { contains: search.q, mode: 'insensitive' };
    }
    if (search.shiftType) where.shiftType = search.shiftType as any;
    if (search.isActive !== undefined) where.isActive = search.isActive;

    const result = await shiftRepository.findAll(companyId, {
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
    const shift = await shiftRepository.findById(id, companyId);
    if (!shift) throw new NotFoundError('Shift not found');
    return shift;
  }

  async create(companyId: string, data: CreateShiftInput, createdById: string) {
    const shift = await shiftRepository.create({
      company: { connect: { id: companyId } },
      name: data.name,
      shiftType: data.shiftType as any,
      startTime: data.startTime,
      endTime: data.endTime,
      breakMinutes: data.breakMinutes,
      daysOfWeek: data.daysOfWeek || [1, 2, 3, 4, 5],
      isActive: data.isActive ?? true,
      notes: data.notes,
    } as Prisma.ShiftCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'SHIFT_CREATED',
      entityType: 'Shift',
      entityId: shift.id,
      description: `Shift ${data.name} created`,
    });

    return shift;
  }

  async update(id: string, companyId: string, data: UpdateShiftInput, updatedById: string) {
    const existing = await shiftRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Shift not found');

    const updateData: Prisma.ShiftUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.shiftType !== undefined) updateData.shiftType = data.shiftType as any;
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.breakMinutes !== undefined) updateData.breakMinutes = data.breakMinutes;
    if (data.daysOfWeek !== undefined) updateData.daysOfWeek = data.daysOfWeek;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.notes !== undefined) updateData.notes = data.notes;

    await shiftRepository.update(id, companyId, updateData);

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'SHIFT_UPDATED',
      entityType: 'Shift',
      entityId: id,
      description: `Shift ${existing.name} updated`,
    });

    return shiftRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string, deletedById: string) {
    const existing = await shiftRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Shift not found');

    await shiftRepository.delete(id, companyId);

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'SHIFT_DELETED',
      entityType: 'Shift',
      entityId: id,
      description: `Shift ${existing.name} deleted`,
    });

    return { message: 'Shift deleted successfully' };
  }

  async getActive(companyId: string) {
    return shiftRepository.findActive(companyId);
  }

  async getByType(companyId: string, shiftType: string) {
    return shiftRepository.findByType(companyId, shiftType);
  }
}

export const shiftService = new ShiftService();
