import { FeatureFlagRepository } from '../repositories/feature-flag.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { CreateFeatureFlagSchema, UpdateFeatureFlagSchema } from '../dto';
import { z } from 'zod';

export class FeatureFlagService {
  private repo = new FeatureFlagRepository();
  private auditRepo = new AuditLogRepository();

  async listFlags(params: { page: number; limit: number; companyId?: string }) {
    const where: any = {};
    if (params.companyId) where.companyId = params.companyId;

    return this.repo.findAll({
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      where,
    });
  }

  async createFlag(data: z.infer<typeof CreateFeatureFlagSchema>, createdBy?: string) {
    const flag = await this.repo.create({
      companyId: data.companyId,
      featureKey: data.featureKey,
      isEnabled: data.isEnabled,
      config: data.config || {},
    });

    await this.auditRepo.create({
      userId: createdBy,
      action: 'CREATE',
      entityType: 'FeatureFlag',
      entityId: flag.id,
      details: `Created feature flag ${data.featureKey} for company ${data.companyId}`,
    });

    return flag;
  }

  async updateFlag(id: string, data: z.infer<typeof UpdateFeatureFlagSchema>, updatedBy?: string) {
    const updateData: any = {};
    if (data.isEnabled !== undefined) {
      updateData.isEnabled = data.isEnabled;
      updateData.enabledAt = data.isEnabled ? new Date() : null;
      updateData.disabledAt = data.isEnabled ? null : new Date();
    }
    if (data.config !== undefined) updateData.config = data.config;

    const flag = await this.repo.update(id, updateData);

    await this.auditRepo.create({
      userId: updatedBy,
      action: 'UPDATE',
      entityType: 'FeatureFlag',
      entityId: id,
      details: `Updated feature flag ${id}`,
    });

    return flag;
  }

  async deleteFlag(id: string, deletedBy?: string) {
    const flag = await this.repo.delete(id);

    await this.auditRepo.create({
      userId: deletedBy,
      action: 'DELETE',
      entityType: 'FeatureFlag',
      entityId: id,
      details: `Deleted feature flag ${id}`,
    });

    return flag;
  }
}
