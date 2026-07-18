import { prisma } from '@/lib/prisma';

export class InventoryAnalyticsService {
  async getOverview(companyId: string) {
    const [totalParts, totalWarehouses, totalSuppliers, totalTools, lowStockCount, pendingOrders, totalStockValue] = await Promise.all([
      prisma.inventoryPart.count({ where: { companyId, deletedAt: null } }),
      prisma.warehouse.count({ where: { companyId, deletedAt: null } }),
      prisma.supplier.count({ where: { companyId, deletedAt: null } }),
      prisma.tool.count({ where: { companyId, deletedAt: null } }),
      prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "Stock" s JOIN "InventoryPart" p ON s."partId" = p.id WHERE s."companyId" = '${companyId}' AND s."deletedAt" IS NULL AND p."minimumStock" > 0 AND s.quantity <= p."minimumStock"`).then((r: unknown) => Number((r as { count: number }[])[0]?.count || 0)),
      prisma.purchaseOrder.count({ where: { companyId, deletedAt: null, status: { in: ['DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED'] } } }),
      prisma.stock.aggregate({ where: { companyId, deletedAt: null }, _sum: { quantity: true } }),
    ]);
    return { totalParts, totalWarehouses, totalSuppliers, totalTools, lowStockCount, pendingOrders, totalStockValue: totalStockValue._sum.quantity || 0 };
  }

  async getStockValueByWarehouse(companyId: string) {
    const stocks = await prisma.stock.findMany({
      where: { companyId, deletedAt: null },
      include: { warehouse: { select: { name: true } }, part: { select: { unitPrice: true } } },
    });
    const byWarehouse: Record<string, { name: string; value: number; quantity: number }> = {};
    for (const s of stocks) {
      const name = s.warehouse?.name || 'Unknown';
      if (!byWarehouse[name]) byWarehouse[name] = { name, value: 0, quantity: 0 };
      byWarehouse[name].quantity += s.quantity;
      byWarehouse[name].value += s.quantity * (s.part?.unitPrice || 0);
    }
    return Object.values(byWarehouse);
  }

  async getTopMovingParts(companyId: string, limit = 10) {
    const movements = await prisma.stockMovement.groupBy({
      by: ['stockId'],
      where: { companyId, deletedAt: null },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });
    const stockIds = movements.map(m => m.stockId);
    const stocks = await prisma.stock.findMany({
      where: { id: { in: stockIds } },
      include: { part: { select: { name: true, partNumber: true } } },
    });
    const stockMap = new Map(stocks.map(s => [s.id, s]));
    return movements.map(m => ({
      stockId: m.stockId,
      partName: stockMap.get(m.stockId)?.part?.name || 'Unknown',
      partNumber: stockMap.get(m.stockId)?.part?.partNumber || 'Unknown',
      totalQuantity: Math.abs(m._sum.quantity || 0),
    }));
  }
}

export const inventoryAnalyticsService = new InventoryAnalyticsService();
