import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class ApprovalWorkflowRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.ApprovalWorkflowWhereInput = { companyId, deletedAt: null };
    if (search.q) where.name = { contains: search.q, mode: 'insensitive' };
    if (search.workflowType) where.workflowType = search.workflowType;
    if (search.isActive !== undefined) where.isActive = search.isActive === 'true';

    const pageNum = Number(search.page) || 1;
    const limitNum = Number(search.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.approvalWorkflow.findMany({
        where, skip: (pageNum - 1) * limitNum as number, take: limitNum as number,
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.approvalWorkflow.count({ where }),
    ]);
    return { workflows: data, total };
  }

  async findById(id: string, companyId: string) {
    const wf = await prisma.approvalWorkflow.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });
    if (!wf) throw new AppError('Approval workflow not found', 404, 'WORKFLOW_NOT_FOUND');
    return wf;
  }

  async create(companyId: string, data: any) {
    const { steps, ...wfData } = data;
    return prisma.approvalWorkflow.create({
      data: { ...wfData, companyId, steps: steps ? { create: steps } : undefined },
      include: { steps: true },
    });
  }

  async update(id: string, companyId: string, data: any) {
    await this.findById(id, companyId);
    const { steps, ...wfData } = data;
    return prisma.approvalWorkflow.update({
      where: { id },
      data: { ...wfData, steps: steps ? { deleteMany: {}, create: steps } : undefined },
      include: { steps: true },
    });
  }

  async delete(id: string, companyId: string) {
    await this.findById(id, companyId);
    return prisma.approvalWorkflow.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export class ApprovalRequestRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.ApprovalRequestWhereInput = { companyId, deletedAt: null };
    if (search.status) where.status = search.status;
    if (search.entityType) where.entityType = search.entityType;

    const pageNum = Number(search.page) || 1;
    const limitNum = Number(search.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.approvalRequest.findMany({
        where, skip: (pageNum - 1) * limitNum as number, take: limitNum as number,
        include: { workflow: true, requester: { select: { firstName: true, lastName: true } }, decider: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.approvalRequest.count({ where }),
    ]);
    return { requests: data, total };
  }

  async findById(id: string, companyId: string) {
    const req = await prisma.approvalRequest.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { workflow: { include: { steps: true } }, requester: true, decider: true, steps: true },
    });
    if (!req) throw new AppError('Approval request not found', 404, 'REQUEST_NOT_FOUND');
    return req;
  }

  async create(companyId: string, data: any, userId: string) {
    return prisma.approvalRequest.create({
      data: { ...data, companyId, requesterId: userId },
      include: { workflow: true },
    });
  }

  async update(id: string, companyId: string, data: any, userId: string) {
    await this.findById(id, companyId);
    return prisma.approvalRequest.update({
      where: { id },
      data: { ...data, decidedBy: userId, decidedAt: new Date() },
    });
  }
}

export const approvalWorkflowRepository = new ApprovalWorkflowRepository();
export const approvalRequestRepository = new ApprovalRequestRepository();
