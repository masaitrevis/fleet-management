import { prisma } from '@/lib/prisma';

export class FeatureFlagService {
  constructor(private companyId: string) {}

  async getFeatureFlags(): Promise<any[]> {
    return prisma.featureFlag.findMany({
      where: { companyId: this.companyId },
      orderBy: { featureKey: 'asc' },
    });
  }

  async isEnabled(featureKey: string): Promise<boolean> {
    const flag = await prisma.featureFlag.findUnique({
      where: { companyId_featureKey: { companyId: this.companyId, featureKey } },
    });
    return flag?.isEnabled ?? false;
  }

  async enable(featureKey: string, enabledBy?: string, config?: Record<string, any>): Promise<any> {
    return prisma.featureFlag.upsert({
      where: { companyId_featureKey: { companyId: this.companyId, featureKey } },
      create: {
        companyId: this.companyId,
        featureKey,
        isEnabled: true,
        config: config || {},
        enabledAt: new Date(),
        enabledBy,
      },
      update: {
        isEnabled: true,
        config: config || undefined,
        enabledAt: new Date(),
        enabledBy,
        disabledAt: null,
      },
    });
  }

  async disable(featureKey: string): Promise<any> {
    return prisma.featureFlag.update({
      where: { companyId_featureKey: { companyId: this.companyId, featureKey } },
      data: {
        isEnabled: false,
        disabledAt: new Date(),
      },
    });
  }

  async toggle(featureKey: string): Promise<any> {
    const flag = await prisma.featureFlag.findUnique({
      where: { companyId_featureKey: { companyId: this.companyId, featureKey } },
    });

    if (!flag) {
      return this.enable(featureKey);
    }

    return flag.isEnabled ? this.disable(featureKey) : this.enable(featureKey);
  }

  async syncWithPlan(planId: string): Promise<void> {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.featureFlags) return;

    const flags = plan.featureFlags as Record<string, boolean>;
    for (const [featureKey, isEnabled] of Object.entries(flags)) {
      await prisma.featureFlag.upsert({
        where: { companyId_featureKey: { companyId: this.companyId, featureKey } },
        create: { companyId: this.companyId, featureKey, isEnabled },
        update: { isEnabled },
      });
    }
  }

  async getFeatureStatus(): Promise<Record<string, { enabled: boolean; config: any }>> {
    const flags = await prisma.featureFlag.findMany({
      where: { companyId: this.companyId },
    });

    const result: Record<string, { enabled: boolean; config: any }> = {};
    for (const flag of flags) {
      result[flag.featureKey] = { enabled: flag.isEnabled, config: flag.config };
    }

    return result;
  }

  async requireFeature(featureKey: string): Promise<void> {
    const enabled = await this.isEnabled(featureKey);
    if (!enabled) {
      throw new Error(`Feature '${featureKey}' is not enabled for this subscription`);
    }
  }
}
