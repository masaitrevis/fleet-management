import { toolRepository } from '../repositories/tool.repository';
import { CreateToolInput, UpdateToolInput, ToolSearchInput } from '../validators/tool.validator';
import { NotFoundError, ConflictError } from '@/shared/errors/AppError';

export class ToolService {
  async getAll(companyId: string, search: ToolSearchInput) {
    const where: any = { deletedAt: null };
    if (search.q) {
      where.OR = [
        { name: { contains: search.q, mode: 'insensitive' } },
        { toolNumber: { contains: search.q, mode: 'insensitive' } },
        { serialNumber: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.status) where.status = search.status;
    if (search.mechanicId) where.assignedMechanicId = search.mechanicId;
    return toolRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
    });
  }

  async getById(id: string, companyId: string) {
    const tool = await toolRepository.findById(id, companyId);
    if (!tool) throw new NotFoundError('Tool not found');
    return tool;
  }

  async create(companyId: string, data: CreateToolInput) {
    const existing = await toolRepository.findByToolNumber(data.toolNumber, companyId);
    if (existing) throw new ConflictError('Tool number already exists');
    return toolRepository.create({ ...data, company: { connect: { id: companyId } } } as any);
  }

  async update(id: string, companyId: string, data: UpdateToolInput) {
    await this.getById(id, companyId);
    if (data.toolNumber) {
      const existing = await toolRepository.findByToolNumber(data.toolNumber, companyId);
      if (existing && existing.id !== id) throw new ConflictError('Tool number already exists');
    }
    await toolRepository.update(id, companyId, data);
    return this.getById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return toolRepository.delete(id, companyId);
  }
}

export const toolService = new ToolService();
