import { correctiveActionRepository } from '../repositories/corrective-action.repository';

export class CorrectiveActionService {
  async getAll(companyId: string, search: any) { return correctiveActionRepository.findAll(companyId, search); }
  async getById(id: string, companyId: string) { return correctiveActionRepository.findById(id, companyId); }
  async create(companyId: string, data: any) { return correctiveActionRepository.create(companyId, data); }
  async update(id: string, companyId: string, data: any) { return correctiveActionRepository.update(id, companyId, data); }
  async delete(id: string, companyId: string) { return correctiveActionRepository.delete(id, companyId); }
}

export const correctiveActionService = new CorrectiveActionService();
