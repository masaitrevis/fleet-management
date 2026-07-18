import { BackupRepository } from '../repositories/backup.repository';
import { MockBackupProvider } from '../providers/backup.provider';
import { AuditLogRepository } from '../repositories/audit-log.repository';

export class BackupService {
  private repo = new BackupRepository();
  private provider = new MockBackupProvider();
  private auditRepo = new AuditLogRepository();

  async listBackups(params: { page: number; limit: number; status?: string }) {
    const where: any = {};
    if (params.status) where.status = params.status;

    return this.repo.findAll({
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async triggerBackup(type: string, createdBy?: string) {
    const record = await this.repo.create({
      type: type as any,
      status: 'IN_PROGRESS',
      createdBy,
    });

    try {
      const result = await this.provider.createBackup(type);
      await this.repo.update(record.id, {
        status: 'COMPLETED',
        size: result.size,
        path: result.path,
        completedAt: new Date(),
      });
    } catch (error: any) {
      await this.repo.update(record.id, {
        status: 'FAILED',
        error: error.message,
      });
    }

    await this.auditRepo.create({
      userId: createdBy,
      action: 'CREATE',
      entityType: 'BackupRecord',
      entityId: record.id,
      details: `Triggered ${type} backup`,
    });

    return record;
  }
}
