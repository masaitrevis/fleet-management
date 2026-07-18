import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class ComplianceRuleRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.ComplianceRuleWhereInput = { companyId, deletedAt: null };
    if (search.q) where.name = { contains: search.q, mode: 'insensitive' };
    if (search.ruleType) where.ruleType = search.ruleType;
    if (search.status) where.status = search.status;
    if (search.appliesTo) where.appliesTo = search.appliesTo;

    const pageNum = Number(search.page) || 1;
    const limitNum = Number(search.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.complianceRule.findMany({
        where, skip: (pageNum - 1) * limitNum as number, take: limitNum as number,
        orderBy: { priority: 'desc', createdAt: 'desc' },
      }),
      prisma.complianceRule.count({ where }),
    ]);
    return { rules: data, total };
  }

  async findById(id: string, companyId: string) {
    const rule = await prisma.complianceRule.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!rule) throw new AppError('Compliance rule not found', 404, 'COMPLIANCE_RULE_NOT_FOUND');
    return rule;
  }

  async create(companyId: string, data: any) {
    return prisma.complianceRule.create({ data: { ...data, companyId } });
  }

  async update(id: string, companyId: string, data: any) {
    await this.findById(id, companyId);
    return prisma.complianceRule.update({ where: { id }, data });
  }

  async delete(id: string, companyId: string) {
    await this.findById(id, companyId);
    return prisma.complianceRule.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const complianceRuleRepository = new ComplianceRuleRepository();
