import { prisma } from '@/lib/prisma';

export class AnalyticsCacheService {
  constructor(private companyId: string) {}

  async get(key: string, category: string) {
    const cache = await prisma.analyticsCache.findUnique({
      where: { companyId_key: { companyId: this.companyId, key } },
    });
    if (!cache) return null;
    if (cache.expiresAt < new Date()) {
      await prisma.analyticsCache.delete({ where: { id: cache.id } });
      return null;
    }
    return cache.data;
  }

  async set(key: string, category: string, data: any, ttlMinutes = 60) {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    await prisma.analyticsCache.upsert({
      where: { companyId_key: { companyId: this.companyId, key } },
      create: {
        companyId: this.companyId,
        key,
        category,
        data,
        expiresAt,
      },
      update: {
        data,
        expiresAt,
        updatedAt: new Date(),
      },
    });
  }

  async invalidate(category?: string) {
    if (category) {
      await prisma.analyticsCache.deleteMany({
        where: { companyId: this.companyId, category },
      });
    } else {
      await prisma.analyticsCache.deleteMany({
        where: { companyId: this.companyId },
      });
    }
  }

  async cleanup() {
    await prisma.analyticsCache.deleteMany({
      where: { companyId: this.companyId, expiresAt: { lt: new Date() } },
    });
  }
}

export default AnalyticsCacheService;
