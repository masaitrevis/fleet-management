import { approvalWorkflowRepository, approvalRequestRepository } from '../repositories/approval-workflow.repository';

export class ApprovalWorkflowService {
  async getAll(companyId: string, search: any) { return approvalWorkflowRepository.findAll(companyId, search); }
  async getById(id: string, companyId: string) { return approvalWorkflowRepository.findById(id, companyId); }
  async create(companyId: string, data: any) { return approvalWorkflowRepository.create(companyId, data); }
  async update(id: string, companyId: string, data: any) { return approvalWorkflowRepository.update(id, companyId, data); }
  async delete(id: string, companyId: string) { return approvalWorkflowRepository.delete(id, companyId); }
}

export class ApprovalRequestService {
  async getAll(companyId: string, search: any) { return approvalRequestRepository.findAll(companyId, search); }
  async getById(id: string, companyId: string) { return approvalRequestRepository.findById(id, companyId); }
  async create(companyId: string, data: any, userId: string) { return approvalRequestRepository.create(companyId, data, userId); }
  async update(id: string, companyId: string, data: any, userId: string) { return approvalRequestRepository.update(id, companyId, data, userId); }
}

export const approvalWorkflowService = new ApprovalWorkflowService();
export const approvalRequestService = new ApprovalRequestService();
