import { prisma } from '@/lib/prisma';

export class FuelAnalyticsService {
  async getOverview(companyId: string, startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = { companyId, deletedAt: null, ...(Object.keys(dateFilter).length > 0 && { fuelDate: dateFilter }) };

    const [totalLogs, totalCost, totalQuantity, vehicleCount, driverCount] = await Promise.all([
      prisma.fuelLog.count({ where }),
      prisma.fuelLog.aggregate({ where, _sum: { totalCost: true } }).then(r => r._sum.totalCost || 0),
      prisma.fuelLog.aggregate({ where, _sum: { quantity: true } }).then(r => r._sum.quantity || 0),
      prisma.fuelLog.groupBy({ by: ['vehicleId'], where }).then(r => r.length),
      prisma.fuelLog.groupBy({ by: ['driverId'], where }).then(r => r.filter(g => g.driverId).length),
    ]);

    const avgCostPerLog = totalLogs > 0 ? totalCost / totalLogs : 0;

    return {
      totalLogs,
      totalCost,
      totalQuantity,
      vehicleCount,
      driverCount,
      avgCostPerLog,
    };
  }

  async getVehicleStats(companyId: string, vehicleId?: string) {
    const where: any = { companyId };
    if (vehicleId) where.vehicleId = vehicleId;

    const stats = await prisma.vehicleFuelStats.findMany({
      where,
      include: { vehicle: { select: { registrationNumber: true, make: true, model: true } } },
      orderBy: { totalFuelCost: 'desc' },
    });
    return stats;
  }

  async getDriverStats(companyId: string, driverId?: string) {
    const where: any = { companyId };
    if (driverId) where.driverId = driverId;

    const stats = await prisma.driverFuelStats.findMany({
      where,
      include: { driver: { select: { firstName: true, lastName: true } } },
      orderBy: { totalFuelCost: 'desc' },
    });
    return stats;
  }

  async getTrends(companyId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily', startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const logs = await prisma.fuelLog.findMany({
      where: { companyId, deletedAt: null, ...(Object.keys(dateFilter).length > 0 && { fuelDate: dateFilter }) },
      select: { fuelDate: true, totalCost: true, quantity: true, odometerReading: true },
      orderBy: { fuelDate: 'asc' },
    });

    const grouped = new Map<string, { cost: number; quantity: number; count: number }>();
    for (const log of logs) {
      const key = this.getPeriodKey(new Date(log.fuelDate), period);
      const existing = grouped.get(key) || { cost: 0, quantity: 0, count: 0 };
      existing.cost += log.totalCost;
      existing.quantity += log.quantity;
      existing.count++;
      grouped.set(key, existing);
    }

    return Array.from(grouped.entries()).map(([date, values]) => ({
      date,
      totalCost: values.cost,
      totalQuantity: values.quantity,
      logCount: values.count,
    }));
  }

  async getEfficiencyRankings(companyId: string) {
    const stats = await prisma.vehicleFuelStats.findMany({
      where: { companyId },
      include: { vehicle: { select: { registrationNumber: true, make: true, model: true, fuelType: true } } },
      orderBy: { averageConsumption: 'desc' },
    });
    return stats.filter(s => s.averageConsumption && s.averageConsumption > 0).map((s, i) => ({ ...s, rank: i + 1 }));
  }

  private getPeriodKey(date: Date, period: string): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const w = this.getWeekNumber(date);
    if (period === 'weekly') return `${y}-W${w}`;
    if (period === 'monthly') return `${y}-${m}`;
    return `${y}-${m}-${d}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}

export const fuelAnalyticsService = new FuelAnalyticsService();
