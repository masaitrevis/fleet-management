import { workshopRepository } from '../repositories/workshop.repository';
import {
  CreateWorkshopInput,
  UpdateWorkshopInput,
  WorkshopSearchInput,
} from '../validators/workshop.validator';
import { NotFoundError } from '@/shared/errors/AppError';
import { Prisma } from '@prisma/client';

export class WorkshopService {
  async getAll(companyId: string, search: WorkshopSearchInput) {
    const where: Prisma.ServiceCenterWhereInput = { deletedAt: null };
    if (search.q) {
      where.OR = [
        { name: { contains: search.q, mode: 'insensitive' } },
        { contactName: { contains: search.q, mode: 'insensitive' } },
        { city: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.isActive !== undefined) where.isActive = search.isActive === 'true';
    if (search.isInternal !== undefined) where.isInternal = search.isInternal === 'true';

    const result = await workshopRepository.findAll(companyId, {
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
    const workshop = await workshopRepository.findById(id, companyId);
    if (!workshop) throw new NotFoundError('Workshop not found');
    return workshop;
  }

  async create(companyId: string, data: CreateWorkshopInput) {
    return workshopRepository.create({
      ...data,
      company: { connect: { id: companyId } },
    });
  }

  async update(id: string, companyId: string, data: UpdateWorkshopInput) {
    const workshop = await workshopRepository.findById(id, companyId);
    if (!workshop) throw new NotFoundError('Workshop not found');
    await workshopRepository.update(id, companyId, data);
    return workshopRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    const workshop = await workshopRepository.findById(id, companyId);
    if (!workshop) throw new NotFoundError('Workshop not found');
    await workshopRepository.delete(id, companyId);
    return { id, deleted: true };
  }
}

export const workshopService = new WorkshopService();
