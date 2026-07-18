import { prisma } from '@/lib/prisma';

export type ResourceType =
  | 'VEHICLE'
  | 'DRIVER'
  | 'USER'
  | 'BRANCH'
  | 'WAREHOUSE'
  | 'GPS_DEVICE'
  | 'API_REQUEST'
  | 'STORAGE'
  | 'REPORT'
  | 'NOTIFICATION';

export class UsageMonitoringService {
  constructor(private companyId: string) {}

  async getUsage(resourceType: ResourceType): Promise<any> {
    const currentPeriod = this.getCurrentPeriod();

    const record = await prisma.usageRecord.findUnique({
      where: {
        companyId_resourceType_periodStart: {
          companyId: this.companyId,
          resourceType,
          periodStart: currentPeriod.start,
        },
      },
    });

    if (!record) {
      return { currentUsage: 0, limitValue: null, isExceeded: false, usagePercent: 0 };
    }

    const limit = record.limitValue || 0;
    const usagePercent = limit > 0 ? Math.round((record.currentUsage / limit) * 100) : 0;

    return {
      ...record,
      usagePercent: Math.min(usagePercent, 100),
    };
  }

  async getAllUsage(): Promise<Record<ResourceType, any>> {
    const currentPeriod = this.getCurrentPeriod();

    const records = await prisma.usageRecord.findMany({
      where: {
        companyId: this.companyId,
        periodStart: currentPeriod.start,
      },
    });

    const result: Record<ResourceType, any> = {} as any;
    const types: ResourceType[] = ['VEHICLE', 'DRIVER', 'USER', 'BRANCH', 'WAREHOUSE', 'GPS_DEVICE', 'API_REQUEST', 'STORAGE', 'REPORT', 'NOTIFICATION'];

    for (const type of types) {
      const record = records.find((r) => r.resourceType === type);
      if (record) {
        const limit = record.limitValue || 0;
        const usagePercent = limit > 0 ? Math.round((record.currentUsage / limit) * 100) : 0;
        result[type] = { ...record, usagePercent: Math.min(usagePercent, 100) };
      } else {
        result[type] = { currentUsage: 0, limitValue: null, isExceeded: false, usagePercent: 0 };
      }
    }

    return result;
  }

  async incrementUsage(resourceType: ResourceType, amount = 1): Promise<any> {
    const currentPeriod = this.getCurrentPeriod();

    const subscription = await prisma.companySubscription.findUnique({
      where: { companyId: this.companyId },
      include: { plan: true },
    });

    const limit = this.getLimitFromPlan(subscription, resourceType);

    const record = await prisma.usageRecord.upsert({
      where: {
        companyId_resourceType_periodStart: {
          companyId: this.companyId,
          resourceType,
          periodStart: currentPeriod.start,
        },
      },
      create: {
        companyId: this.companyId,
        resourceType,
        currentUsage: amount,
        limitValue: limit,
        periodStart: currentPeriod.start,
        periodEnd: currentPeriod.end,
        isExceeded: limit ? amount > limit : false,
      },
      update: {
        currentUsage: { increment: amount },
        isExceeded: limit ? { set: true } : undefined,
      },
    });

    // Check if exceeded after update
    if (limit && record.currentUsage > limit) {
      await prisma.usageRecord.update({
        where: { id: record.id },
        data: { isExceeded: true, exceededAt: new Date() },
      });
    }

    return record;
  }

  async checkLimit(resourceType: ResourceType): Promise<{ allowed: boolean; current: number; limit: number | null }> {
    const currentPeriod = this.getCurrentPeriod();

    const subscription = await prisma.companySubscription.findUnique({
      where: { companyId: this.companyId },
      include: { plan: true },
    });

    const limit = this.getLimitFromPlan(subscription, resourceType);
    if (!limit) return { allowed: true, current: 0, limit: null };

    const record = await prisma.usageRecord.findUnique({
      where: {
        companyId_resourceType_periodStart: {
          companyId: this.companyId,
          resourceType,
          periodStart: currentPeriod.start,
        },
      },
    });

    const current = record?.currentUsage || 0;
    return { allowed: current < limit, current, limit };
  }

  async enforceLimit(resourceType: ResourceType): Promise<void> {
    const check = await this.checkLimit(resourceType);
    if (!check.allowed) {
      throw new Error(`Usage limit exceeded for ${resourceType}. Current: ${check.current}, Limit: ${check.limit}`);
    }
  }

  async syncLimits(): Promise<void> {
    const subscription = await prisma.companySubscription.findUnique({
      where: { companyId: this.companyId },
      include: { plan: true },
    });

    if (!subscription) return;

    const currentPeriod = this.getCurrentPeriod();
    const types: ResourceType[] = ['VEHICLE', 'DRIVER', 'USER', 'BRANCH', 'WAREHOUSE', 'GPS_DEVICE', 'API_REQUEST', 'STORAGE', 'REPORT', 'NOTIFICATION'];

    for (const resourceType of types) {
      const limit = this.getLimitFromPlan(subscription, resourceType);
      await prisma.usageRecord.upsert({
        where: {
          companyId_resourceType_periodStart: {
            companyId: this.companyId,
            resourceType,
            periodStart: currentPeriod.start,
          },
        },
        create: {
          companyId: this.companyId,
          resourceType,
          currentUsage: 0,
          limitValue: limit,
          periodStart: currentPeriod.start,
          periodEnd: currentPeriod.end,
        },
        update: { limitValue: limit },
      });
    }
  }

  private getCurrentPeriod(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  }

  private getLimitFromPlan(subscription: any, resourceType: ResourceType): number | null {
    if (!subscription || !subscription.plan) return null;

    const plan = subscription.plan;
    const limits: Record<ResourceType, number | null> = {
      VEHICLE: plan.vehicleLimit || null,
      DRIVER: plan.driverLimit || null,
      USER: plan.userLimit || null,
      BRANCH: plan.branchLimit || null,
      WAREHOUSE: plan.warehouseLimit || null,
      GPS_DEVICE: plan.gpsDeviceLimit || null,
      API_REQUEST: plan.apiRequestLimit || null,
      STORAGE: plan.storageLimit || null,
      REPORT: plan.reportLimit || null,
      NOTIFICATION: plan.notificationLimit || null,
    };

    return limits[resourceType];
  }
}
