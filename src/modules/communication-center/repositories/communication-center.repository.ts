import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class CommunicationCenterRepository {
  async findThreads(companyId: string, search: any) {
    const where: Prisma.CommunicationThreadWhereInput = { companyId, deletedAt: null };
    if (search.q) where.subject = { contains: search.q, mode: 'insensitive' };
    if (search.isArchived !== undefined) where.isArchived = search.isArchived === 'true';

    const pageNum = Number(search.page) || 1;
    const limitNum = Number(search.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.communicationThread.findMany({
        where, skip: (pageNum - 1) * limitNum, take: limitNum,
        orderBy: { lastMessageAt: 'desc' },
        include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
      }),
      prisma.communicationThread.count({ where }),
    ]);
    return { threads: data, total };
  }

  async findThreadById(id: string, companyId: string) {
    const t = await prisma.communicationThread.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!t) throw new AppError('Thread not found', 404, 'THREAD_NOT_FOUND');
    return t;
  }

  async createThread(companyId: string, data: any) {
    return prisma.communicationThread.create({
      data: { ...data, companyId },
      include: { messages: true },
    });
  }

  async createMessage(companyId: string, data: any, senderId: string) {
    const thread = await prisma.communicationThread.findFirst({ where: { id: data.threadId, companyId } });
    if (!thread) throw new AppError('Thread not found', 404, 'THREAD_NOT_FOUND');
    return prisma.communicationMessage.create({
      data: { ...data, senderId },
    });
  }

  async markThreadRead(id: string, companyId: string) {
    await this.findThreadById(id, companyId);
    return prisma.communicationMessage.updateMany({
      where: { threadId: id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async archiveThread(id: string, companyId: string) {
    await this.findThreadById(id, companyId);
    return prisma.communicationThread.update({ where: { id }, data: { isArchived: true } });
  }

  async deleteThread(id: string, companyId: string) {
    await this.findThreadById(id, companyId);
    return prisma.communicationThread.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const communicationCenterRepository = new CommunicationCenterRepository();
