import { prisma } from '@/lib/prisma';
import {
  SubscriptionStatus,
  BillingInterval,
  PaymentMethod,
  Prisma,
} from '@prisma/client';

export interface PlanLimits {
  vehicles: number;
  drivers: number;
  users: number;
  branches: number;
  warehouses: number;
  gpsDevices: number;
  apiRequests: number;
  storageGB: number;
  reports: number;
  notifications: number;
}

export interface SubscriptionData {
  planId: string;
  startDate: Date;
  endDate?: Date;
  autoRenew?: boolean;
  paymentMethod?: PaymentMethod;
  couponCode?: string;
}

export class SubscriptionService {
  constructor(private companyId: string) {}

  async getCurrentSubscription() {
    return prisma.companySubscription.findUnique({
      where: { companyId: this.companyId },
      include: { plan: true },
    });
  }

  async getAvailablePlans() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async startTrial(planId: string): Promise<any> {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');

    const trialEndsAt = new Date(Date.now() + (plan.trialDays || 14) * 24 * 60 * 60 * 1000);

    const subscription = await prisma.companySubscription.upsert({
      where: { companyId: this.companyId },
      create: {
        companyId: this.companyId,
        planId: plan.id,
        status: SubscriptionStatus.TRIAL,
        startDate: new Date(),
        trialEndsAt,
        vehicleLimit: plan.vehicleLimit,
        userLimit: plan.userLimit,
        tripLimit: plan.tripLimit,
        amount: 0,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
        autoRenew: true,
      },
      update: {
        planId: plan.id,
        status: SubscriptionStatus.TRIAL,
        startDate: new Date(),
        trialEndsAt,
        vehicleLimit: plan.vehicleLimit,
        userLimit: plan.userLimit,
        tripLimit: plan.tripLimit,
        amount: 0,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
        autoRenew: true,
        cancelledAt: null,
        cancellationReason: null,
      },
    });

    // Initialize feature flags from plan
    await this.syncFeatureFlags(plan.id);

    return subscription;
  }

  async activateSubscription(data: SubscriptionData): Promise<any> {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: data.planId } });
    if (!plan) throw new Error('Plan not found');

    const amount = data.couponCode
      ? await this.applyCouponDiscount(data.couponCode, plan.price)
      : plan.price;

    const subscription = await prisma.companySubscription.upsert({
      where: { companyId: this.companyId },
      create: {
        companyId: this.companyId,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: data.startDate,
        endDate: data.endDate,
        vehicleLimit: plan.vehicleLimit,
        userLimit: plan.userLimit,
        tripLimit: plan.tripLimit,
        amount,
        currency: plan.currency,
        billingInterval: data.paymentMethod ? plan.billingInterval : BillingInterval.MONTHLY,
        nextBillingDate: this.calculateNextBillingDate(data.startDate, plan.billingInterval),
        autoRenew: data.autoRenew ?? true,
        paymentMethod: data.paymentMethod,
      },
      update: {
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: data.startDate,
        endDate: data.endDate,
        vehicleLimit: plan.vehicleLimit,
        userLimit: plan.userLimit,
        tripLimit: plan.tripLimit,
        amount,
        currency: plan.currency,
        billingInterval: data.paymentMethod ? plan.billingInterval : BillingInterval.MONTHLY,
        nextBillingDate: this.calculateNextBillingDate(data.startDate, plan.billingInterval),
        autoRenew: data.autoRenew ?? true,
        paymentMethod: data.paymentMethod,
        cancelledAt: null,
        cancellationReason: null,
      },
    });

    await this.syncFeatureFlags(plan.id);
    return subscription;
  }

  async upgrade(planId: string): Promise<any> {
    const current = await this.getCurrentSubscription();
    if (!current) throw new Error('No active subscription');

    const newPlan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!newPlan) throw new Error('Plan not found');

    // Prorated calculation logic could go here
    const subscription = await prisma.companySubscription.update({
      where: { companyId: this.companyId },
      data: {
        planId: newPlan.id,
        vehicleLimit: newPlan.vehicleLimit,
        userLimit: newPlan.userLimit,
        tripLimit: newPlan.tripLimit,
        amount: newPlan.price,
        currency: newPlan.currency,
        billingInterval: newPlan.billingInterval,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    await this.syncFeatureFlags(newPlan.id);
    return subscription;
  }

  async downgrade(planId: string): Promise<any> {
    const current = await this.getCurrentSubscription();
    if (!current) throw new Error('No active subscription');

    const newPlan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!newPlan) throw new Error('Plan not found');

    // Downgrade at end of current billing period
    const subscription = await prisma.companySubscription.update({
      where: { companyId: this.companyId },
      data: {
        planId: newPlan.id,
        amount: newPlan.price,
        currency: newPlan.currency,
        billingInterval: newPlan.billingInterval,
      },
    });

    return subscription;
  }

  async renew(): Promise<any> {
    const subscription = await this.getCurrentSubscription();
    if (!subscription) throw new Error('No active subscription');

    const nextBillingDate = this.calculateNextBillingDate(
      subscription.nextBillingDate || new Date(),
      subscription.billingInterval
    );

    return prisma.companySubscription.update({
      where: { companyId: this.companyId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate,
      },
    });
  }

  async cancel(reason?: string): Promise<any> {
    return prisma.companySubscription.update({
      where: { companyId: this.companyId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
        autoRenew: false,
      },
    });
  }

  async pause(): Promise<any> {
    return prisma.companySubscription.update({
      where: { companyId: this.companyId },
      data: { status: SubscriptionStatus.PAUSED },
    });
  }

  async resume(): Promise<any> {
    return prisma.companySubscription.update({
      where: { companyId: this.companyId },
      data: { status: SubscriptionStatus.ACTIVE },
    });
  }

  async expire(): Promise<any> {
    return prisma.companySubscription.update({
      where: { companyId: this.companyId },
      data: { status: SubscriptionStatus.EXPIRED },
    });
  }

  async enterGracePeriod(): Promise<any> {
    return prisma.companySubscription.update({
      where: { companyId: this.companyId },
      data: { status: SubscriptionStatus.GRACE_PERIOD },
    });
  }

  async checkTrialExpiration(): Promise<boolean> {
    const subscription = await this.getCurrentSubscription();
    if (!subscription || subscription.status !== SubscriptionStatus.TRIAL) return false;

    if (subscription.trialEndsAt && subscription.trialEndsAt < new Date()) {
      await prisma.companySubscription.update({
        where: { companyId: this.companyId },
        data: { status: SubscriptionStatus.TRIAL_EXPIRED },
      });
      return true;
    }
    return false;
  }

  async getSubscriptionHistory(): Promise<any[]> {
    return prisma.companySubscription.findMany({
      where: { companyId: this.companyId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private calculateNextBillingDate(startDate: Date, interval: BillingInterval): Date {
    const date = new Date(startDate);
    switch (interval) {
      case BillingInterval.MONTHLY:
        date.setMonth(date.getMonth() + 1);
        break;
      case BillingInterval.QUARTERLY:
        date.setMonth(date.getMonth() + 3);
        break;
      case BillingInterval.YEARLY:
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    return date;
  }

  private async applyCouponDiscount(couponCode: string, originalPrice: number): Promise<number> {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon || !coupon.isActive) return originalPrice;

    if (coupon.endDate && coupon.endDate < new Date()) return originalPrice;
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return originalPrice;

    if (coupon.discountType === 'PERCENTAGE') {
      return originalPrice * (1 - coupon.discountValue / 100);
    } else if (coupon.discountType === 'FIXED') {
      return Math.max(0, originalPrice - coupon.discountValue);
    }
    return originalPrice;
  }

  private async syncFeatureFlags(planId: string): Promise<void> {
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
}
