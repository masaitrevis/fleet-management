import { prisma } from '@/lib/prisma';

export class CouponService {
  constructor(private companyId?: string) {}

  async validateCoupon(code: string, planSlug?: string, amount?: number): Promise<{ valid: boolean; coupon?: any; error?: string }> {
    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) return { valid: false, error: 'Coupon not found' };
    if (!coupon.isActive) return { valid: false, error: 'Coupon is inactive' };
    if (coupon.endDate && coupon.endDate < new Date()) return { valid: false, error: 'Coupon has expired' };
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { valid: false, error: 'Coupon usage limit reached' };
    if (coupon.minAmount && amount !== undefined && amount < coupon.minAmount) {
      return { valid: false, error: `Minimum amount required: ${coupon.minAmount}` };
    }
    if (planSlug && coupon.applicablePlans.length > 0 && !coupon.applicablePlans.includes(planSlug)) {
      return { valid: false, error: 'Coupon not applicable for this plan' };
    }

    return { valid: true, coupon };
  }

  async applyCoupon(code: string, originalAmount: number, planSlug?: string): Promise<{ amount: number; discount: number; coupon: any }> {
    const validation = await this.validateCoupon(code, planSlug, originalAmount);
    if (!validation.valid) throw new Error(validation.error || 'Invalid coupon');

    const coupon = validation.coupon!;
    let discount = 0;

    if (coupon.discountType === 'PERCENTAGE') {
      discount = originalAmount * (coupon.discountValue / 100);
    } else if (coupon.discountType === 'FIXED') {
      discount = coupon.discountValue;
    }

    discount = Math.min(discount, originalAmount);
    const amount = originalAmount - discount;

    // Increment usage count
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });

    return { amount, discount, coupon };
  }

  async createCoupon(data: any): Promise<any> {
    return prisma.coupon.create({
      data: {
        ...data,
        companyId: this.companyId,
      },
    });
  }

  async getCoupons(page = 1, limit = 20): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const where = this.companyId ? { OR: [{ companyId: this.companyId }, { isPublic: true }] } : { isPublic: true };

    const [items, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coupon.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getCouponById(id: string): Promise<any> {
    return prisma.coupon.findUnique({ where: { id } });
  }

  async deleteCoupon(id: string): Promise<any> {
    return prisma.coupon.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async generateReferralCode(userId: string): Promise<any> {
    const code = `REF-${userId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    return prisma.coupon.create({
      data: {
        code,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        isReferral: true,
        referredBy: userId,
        referralReward: 500,
        isActive: true,
        isPublic: false,
        startDate: new Date(),
      },
    });
  }
}
