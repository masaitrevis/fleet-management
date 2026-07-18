import { serviceTemplateRepository } from '../repositories/service-template.repository';
import {
  CreateServiceTemplateInput,
  UpdateServiceTemplateInput,
  ServiceTemplateSearchInput,
  ServiceTemplateItemInput,
} from '../validators/service-template.validator';
import { NotFoundError } from '@/shared/errors/AppError';
import { Prisma } from '@prisma/client';

export class ServiceTemplateService {
  async getAll(companyId: string, search: ServiceTemplateSearchInput) {
    const where: Prisma.ServiceTemplateWhereInput = { deletedAt: null };
    if (search.q) {
      where.OR = [
        { name: { contains: search.q, mode: 'insensitive' } },
        { description: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.templateType) where.templateType = search.templateType as any;
    if (search.isActive !== undefined) where.isActive = search.isActive === 'true';

    const result = await serviceTemplateRepository.findAll(companyId, {
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
    const template = await serviceTemplateRepository.findById(id, companyId);
    if (!template) throw new NotFoundError('Service template not found');
    return template;
  }

  async create(companyId: string, data: CreateServiceTemplateInput) {
    return serviceTemplateRepository.create({
      ...data,
      company: { connect: { id: companyId } },
    });
  }

  async createWithItems(
    companyId: string,
    data: CreateServiceTemplateInput,
    items: ServiceTemplateItemInput[]
  ) {
    const template = await serviceTemplateRepository.create({
      ...data,
      company: { connect: { id: companyId } },
      serviceTemplateItems: {
        create: items.map((item) => ({
          ...item,
        })),
      },
    });
    return template;
  }

  async update(id: string, companyId: string, data: UpdateServiceTemplateInput) {
    const template = await serviceTemplateRepository.findById(id, companyId);
    if (!template) throw new NotFoundError('Service template not found');
    await serviceTemplateRepository.update(id, companyId, data);
    return serviceTemplateRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    const template = await serviceTemplateRepository.findById(id, companyId);
    if (!template) throw new NotFoundError('Service template not found');
    await serviceTemplateRepository.deleteItems(id);
    await serviceTemplateRepository.delete(id, companyId);
    return { id, deleted: true };
  }

  async addItem(templateId: string, companyId: string, item: ServiceTemplateItemInput) {
    const template = await serviceTemplateRepository.findById(templateId, companyId);
    if (!template) throw new NotFoundError('Service template not found');
    return serviceTemplateRepository.createItem({
      ...item,
      serviceTemplate: { connect: { id: templateId } },
    });
  }
}

export const serviceTemplateService = new ServiceTemplateService();
