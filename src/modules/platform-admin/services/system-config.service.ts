import { SystemConfigRepository } from '../repositories/system-config.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { UpdateSystemConfigSchema } from '../dto';
import { z } from 'zod';

export class SystemConfigService {
  private repo = new SystemConfigRepository();
  private auditRepo = new AuditLogRepository();

  async getAllConfig(category?: string) {
    return this.repo.findAll({ category });
  }

  async updateConfig(data: z.infer<typeof UpdateSystemConfigSchema>, updatedBy?: string) {
    const config = await this.repo.upsert(data.key, {
      key: data.key,
      value: data.value,
      category: data.category,
      description: data.description,
      isEncrypted: data.isEncrypted,
    });

    await this.auditRepo.create({
      userId: updatedBy,
      action: 'UPDATE',
      entityType: 'PlatformConfig',
      entityId: config.id,
      details: `Updated config ${data.key} in category ${data.category}`,
      oldValues: {},
      newValues: { value: data.value },
    });

    return config;
  }
}
