import { partCategoryRepository } from '../repositories/part-category.repository';
import { CreatePartCategoryInput, UpdatePartCategoryInput, PartCategorySearchInput } from '../validators/part-category.validator';
import { NotFoundError, BadRequestError } from '@/shared/errors/AppError';

export class PartCategoryService {
  async getAll(companyId: string, search: PartCategorySearchInput) {
    const where: any = { deletedAt: null };
    if (search.q) where.name = { contains: search.q, mode: 'insensitive' };
    if (search.parentId) where.parentId = search.parentId;
    return partCategoryRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
    });
  }

  async getById(id: string, companyId: string) {
    const cat = await partCategoryRepository.findById(id, companyId);
    if (!cat) throw new NotFoundError('Category not found');
    return cat;
  }

  async create(companyId: string, data: CreatePartCategoryInput) {
    if (data.parentId) {
      const parent = await partCategoryRepository.findById(data.parentId, companyId);
      if (!parent) throw new NotFoundError('Parent category not found');
    }
    return partCategoryRepository.create({ ...data, company: { connect: { id: companyId } } } as any);
  }

  async update(id: string, companyId: string, data: UpdatePartCategoryInput) {
    await this.getById(id, companyId);
    if (data.parentId && data.parentId === id) throw new BadRequestError('Category cannot be its own parent');
    await partCategoryRepository.update(id, companyId, data);
    return this.getById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return partCategoryRepository.delete(id, companyId);
  }
}

export const partCategoryService = new PartCategoryService();
