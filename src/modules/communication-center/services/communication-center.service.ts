import { communicationCenterRepository } from '../repositories/communication-center.repository';

export class CommunicationCenterService {
  async getThreads(companyId: string, search: any) { return communicationCenterRepository.findThreads(companyId, search); }
  async getThreadById(id: string, companyId: string) { return communicationCenterRepository.findThreadById(id, companyId); }
  async createThread(companyId: string, data: any) { return communicationCenterRepository.createThread(companyId, data); }
  async createMessage(companyId: string, data: any, senderId: string) { return communicationCenterRepository.createMessage(companyId, data, senderId); }
  async markThreadRead(id: string, companyId: string) { return communicationCenterRepository.markThreadRead(id, companyId); }
  async archiveThread(id: string, companyId: string) { return communicationCenterRepository.archiveThread(id, companyId); }
  async deleteThread(id: string, companyId: string) { return communicationCenterRepository.deleteThread(id, companyId); }
}

export const communicationCenterService = new CommunicationCenterService();
