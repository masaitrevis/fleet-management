import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class DeliveryQueueRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.DeliveryQueueWhereInput = { companyId };
    if (search.status) where.status = search.status;
    if (search.channel) where.channel = search.channel;

    const pageNum = Number(search.page) || 1;
    const limitNum = Number(search.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.deliveryQueue.findMany({
        where, skip: (pageNum - 1) * limitNum, take: limitNum,
        orderBy: { priority: 'desc', createdAt: 'asc' },
      }),
      prisma.deliveryQueue.count({ where }),
    ]);
    return { queue: data, total };
  }

  async findById(id: string, companyId: string) {
    const q = await prisma.deliveryQueue.findFirst({ where: { id, companyId } });
    if (!q) throw new AppError('Queue item not found', 404, 'QUEUE_ITEM_NOT_FOUND');
    return q;
  }

  async create(companyId: string, data: any) {
    return prisma.deliveryQueue.create({ data: { ...data, companyId } });
  }

  async updateStatus(id: string, companyId: string, status: string, errorMessage?: string) {
    await this.findById(id, companyId);
    const updateData: any = { status };
    if (status === 'SENT') updateData.processedAt = new Date();
    if (status === 'FAILED') { updateData.failedAt = new Date(); updateData.errorMessage = errorMessage; }
    return prisma.deliveryQueue.update({ where: { id }, data: updateData });
  }

  async update(id: string, companyId: string, data: any) {
    await this.findById(id, companyId);
    return prisma.deliveryQueue.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
  }

  async delete(id: string, companyId: string) {
    await this.findById(id, companyId);
    return prisma.deliveryQueue.delete({ where: { id } });
  }

  async getPending(companyId: string, limit = 50) {
    return prisma.deliveryQueue.findMany({
      where: { companyId, status: 'QUEUED', scheduledFor: { lte: new Date() } },
      orderBy: { priority: 'desc', createdAt: 'asc' },
      take: limit,
    });
  }
}

export const deliveryQueueRepository = new DeliveryQueueRepository();
