import { mechanicRepository } from '../repositories/mechanic.repository';
import {
  CreateMechanicInput,
  UpdateMechanicInput,
  MechanicSearchInput,
} from '../validators/mechanic.validator';
import { NotFoundError, ConflictError } from '@/shared/errors/AppError';
import { Prisma } from '@prisma/client';

export class MechanicService {
  async getAll(companyId: string, search: MechanicSearchInput) {
    const where: Prisma.MechanicWhereInput = { deletedAt: null };
    if (search.q) {
      where.OR = [
        { firstName: { contains: search.q, mode: 'insensitive' } },
        { lastName: { contains: search.q, mode: 'insensitive' } },
        { email: { contains: search.q, mode: 'insensitive' } },
        { employeeId: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.status) where.status = search.status as any;
    if (search.skill) {
      where.skills = { has: search.skill };
    }

    const result = await mechanicRepository.findAll(companyId, {
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
    const mechanic = await mechanicRepository.findById(id, companyId);
    if (!mechanic) throw new NotFoundError('Mechanic not found');
    return mechanic;
  }

  async create(companyId: string, data: CreateMechanicInput) {
    if (data.employeeId) {
      const existing = await mechanicRepository.findByEmployeeId(data.employeeId, companyId);
      if (existing) throw new ConflictError('Mechanic with this employee ID already exists');
    }

    return mechanicRepository.create({
      ...data,
      company: { connect: { id: companyId } },
    });
  }

  async update(id: string, companyId: string, data: UpdateMechanicInput) {
    const mechanic = await mechanicRepository.findById(id, companyId);
    if (!mechanic) throw new NotFoundError('Mechanic not found');

    if (data.employeeId && data.employeeId !== mechanic.employeeId) {
      const existing = await mechanicRepository.findByEmployeeId(data.employeeId, companyId);
      if (existing) throw new ConflictError('Mechanic with this employee ID already exists');
    }

    await mechanicRepository.update(id, companyId, data);
    return mechanicRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    const mechanic = await mechanicRepository.findById(id, companyId);
    if (!mechanic) throw new NotFoundError('Mechanic not found');
    await mechanicRepository.delete(id, companyId);
    return { id, deleted: true };
  }

  async getJobs(id: string, companyId: string) {
    const mechanic = await mechanicRepository.findById(id, companyId);
    if (!mechanic) throw new NotFoundError('Mechanic not found');
    return mechanicRepository.findJobs(id, companyId);
  }
}

export const mechanicService = new MechanicService();
