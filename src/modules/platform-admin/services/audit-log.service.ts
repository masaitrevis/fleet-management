import { AuditLogRepository } from '../repositories/audit-log.repository';

export class AuditLogService {
  private repo = new AuditLogRepository();

  async listLogs(params: { page: number; limit: number; userId?: string; action?: string; entityType?: string }) {
    const where: any = {};
    if (params.userId) where.userId = params.userId;
    if (params.action) where.action = params.action;
    if (params.entityType) where.entityType = params.entityType;

    return this.repo.findAll({
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
