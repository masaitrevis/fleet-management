import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class CorrectiveActionRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.CorrectiveActionWhereInput = { companyId, deletedAt: null };
    if (search.q) where.title = { contains: search.q, mode: 'insensitive' };
    if (search.status) where.status = search.status;
    if (search.assignedTo) where.assignedTo = search.assignedTo;
    if (search.incidentId) where.incidentId = search.incidentId;

    const pageNum = Number(search.page) || 1;
    const limitNum = Number(search.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.correctiveAction.findMany({
        where, skip: (pageNum - 1) * limitNum as number, take: limitNum as number,
        include: { assignee: { select: { firstName: true, lastName: true } }, incident: { select: { title: true, incidentNumber: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.correctiveAction.count({ where }),
    ]);
    return { actions: data, total };
  }

  async findById(id: string, companyId: string) {
    const action = await prisma.correctiveAction.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { assignee: true, completer: true, incident: true, vehicle: true, driver: true },
    });
    if (!action) throw new AppError('Corrective action not found', 404, 'ACTION_NOT_FOUND');
    return action;
  }

  async create(companyId: string, data: any) { return prisma.correctiveAction.create({ data: { ...data, companyId } }); }
  async update(id: string, companyId: string, data: any) { await this.findById(id, companyId); return prisma.correctiveAction.update({ where: { id }, data }); }
  async delete(id: string, companyId: string) { await this.findById(id, companyId); return prisma.correctiveAction.update({ where: { id }, data: { deletedAt: new Date() } }); }
}

export const correctiveActionRepository = new CorrectiveActionRepository();
