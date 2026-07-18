const fs = require('fs');
const path = require('path');

const BASE = '/root/.openclaw/workspace/fleet-management-saas/src/modules';

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function sc(moduleName) {
  return `import { NextRequest, NextResponse } from 'next/server';
import { ${moduleName}Service } from '../services/${moduleName}.service';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}`;
}

// ========== STOCK-MOVEMENT MODULE ==========
writeFile(`${BASE}/stock-movement/validators/stock-movement.validator.ts`, `import { z } from 'zod';
import { StockMovementType } from '@prisma/client';

export const createStockMovementSchema = z.object({
  stockId: z.string().uuid(),
  movementType: z.nativeEnum(StockMovementType),
  quantity: z.number().int(),
  unitPrice: z.number().nonnegative().optional().nullable(),
  totalPrice: z.number().nonnegative().optional().nullable(),
  referenceId: z.string().uuid().optional().nullable(),
  referenceType: z.string().optional().nullable(),
  sourceWarehouseId: z.string().uuid().optional().nullable(),
  destinationWarehouseId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const stockMovementSearchSchema = z.object({
  stockId: z.string().uuid().optional(),
  movementType: z.nativeEnum(StockMovementType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type StockMovementSearchInput = z.infer<typeof stockMovementSearchSchema>;
`);

writeFile(`${BASE}/stock-movement/repositories/stock-movement.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class StockMovementRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.StockMovementWhereInput; orderBy?: Prisma.StockMovementOrderByWithRelationInput } = {}) {
    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: { stock: { include: { part: { select: { id: true, name: true, partNumber: true } }, warehouse: { select: { id: true, name: true } } } } },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.stockMovement.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { movements, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.stockMovement.findFirst({ where: { id, companyId, deletedAt: null }, include: { stock: { include: { part: true, warehouse: true } } } });
  }

  async create(data: Prisma.StockMovementCreateInput) {
    return prisma.stockMovement.create({ data });
  }

  async delete(id: string, companyId: string) {
    return prisma.stockMovement.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const stockMovementRepository = new StockMovementRepository();
`);

writeFile(`${BASE}/stock-movement/services/stock-movement.service.ts`, `import { stockMovementRepository } from '../repositories/stock-movement.repository';
import { CreateStockMovementInput, StockMovementSearchInput } from '../validators/stock-movement.validator';
import { NotFoundError, BadRequestError } from '@/shared/errors/AppError';
import { prisma } from '@/lib/prisma';

export class StockMovementService {
  async getAll(companyId: string, search: StockMovementSearchInput) {
    const where: any = { deletedAt: null };
    if (search.stockId) where.stockId = search.stockId;
    if (search.movementType) where.movementType = search.movementType;
    if (search.startDate || search.endDate) {
      where.createdAt = {};
      if (search.startDate) where.createdAt.gte = new Date(search.startDate);
      if (search.endDate) where.createdAt.lte = new Date(search.endDate);
    }
    return stockMovementRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
    });
  }

  async getById(id: string, companyId: string) {
    const movement = await stockMovementRepository.findById(id, companyId);
    if (!movement) throw new NotFoundError('Stock movement not found');
    return movement;
  }

  async create(companyId: string, data: CreateStockMovementInput) {
    const stock = await prisma.stock.findFirst({ where: { id: data.stockId, companyId, deletedAt: null } });
    if (!stock) throw new NotFoundError('Stock record not found');

    const movement = await stockMovementRepository.create({
      ...data,
      company: { connect: { id: companyId } },
      stock: { connect: { id: data.stockId } },
    } as any);

    // Update stock quantity
    const qtyChange = data.quantity;
    await prisma.stock.update({
      where: { id: data.stockId },
      data: { quantity: { increment: qtyChange }, availableQuantity: { increment: qtyChange }, updatedAt: new Date() },
    });

    return movement;
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return stockMovementRepository.delete(id, companyId);
  }
}

export const stockMovementService = new StockMovementService();
`);

writeFile(`${BASE}/stock-movement/controllers/stock-movement.controller.ts`, sc('stock-movement') + `

export class StockMovementController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = (await import('../validators/stock-movement.validator')).stockMovementSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await stockMovementService.getAll(companyId, search); return successResponse(result); }
    catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) {
    try { const movement = await stockMovementService.getById(id, companyId); return successResponse(movement); }
    catch (error) { return errorResponse(error as Error); }
  }
  async create(req: NextRequest, companyId: string) {
    try { const body = await req.json(); const data = (await import('../validators/stock-movement.validator')).createStockMovementSchema.parse(body); const movement = await stockMovementService.create(companyId, data); return successResponse(movement, 201); }
    catch (error) { return errorResponse(error as Error); }
  }
  async delete(req: NextRequest, companyId: string, id: string) {
    try { await stockMovementService.delete(id, companyId); return successResponse({ message: 'Movement deleted' }); }
    catch (error) { return errorResponse(error as Error); }
  }
}

export const stockMovementController = new StockMovementController();
`);

// ========== PURCHASE-ORDER MODULE ==========
writeFile(`${BASE}/purchase-order/validators/purchase-order.validator.ts`, `import { z } from 'zod';
import { PurchaseOrderStatus } from '@prisma/client';

export const createPurchaseOrderSchema = z.object({
  orderNumber: z.string().min(1).max(50),
  supplierId: z.string().uuid().optional().nullable(),
  status: z.nativeEnum(PurchaseOrderStatus).default(PurchaseOrderStatus.DRAFT),
  orderDate: z.string().datetime().optional().nullable(),
  deliveryDate: z.string().datetime().optional().nullable(),
  expectedDate: z.string().datetime().optional().nullable(),
  totalAmount: z.number().nonnegative().optional().nullable(),
  taxAmount: z.number().nonnegative().optional().nullable(),
  discountAmount: z.number().nonnegative().optional().nullable(),
  currency: z.string().default('KES'),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    partId: z.string().uuid().optional().nullable(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative().default(0),
    totalPrice: z.number().nonnegative().optional().nullable(),
    notes: z.string().optional().nullable(),
  })).default([]),
});

export const updatePurchaseOrderSchema = createPurchaseOrderSchema.partial();

export const purchaseOrderSearchSchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(PurchaseOrderStatus).optional(),
  supplierId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type PurchaseOrderSearchInput = z.infer<typeof purchaseOrderSearchSchema>;
`);

writeFile(`${BASE}/purchase-order/repositories/purchase-order.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class PurchaseOrderRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.PurchaseOrderWhereInput; orderBy?: Prisma.PurchaseOrderOrderByWithRelationInput } = {}) {
    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: { supplier: { select: { id: true, name: true } }, items: { include: { part: { select: { id: true, name: true, partNumber: true } } } } },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.purchaseOrder.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { orders, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.purchaseOrder.findFirst({ where: { id, companyId, deletedAt: null }, include: { supplier: true, items: { include: { part: true } } } });
  }

  async create(data: Prisma.PurchaseOrderCreateInput, items: Prisma.PurchaseOrderItemCreateManyPurchaseOrderInput[]) {
    return prisma.purchaseOrder.create({
      data: { ...data, items: { createMany: { data: items } } },
      include: { supplier: true, items: { include: { part: true } } },
    });
  }

  async update(id: string, companyId: string, data: Prisma.PurchaseOrderUpdateInput) {
    return prisma.purchaseOrder.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.purchaseOrder.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const purchaseOrderRepository = new PurchaseOrderRepository();
`);

writeFile(`${BASE}/purchase-order/services/purchase-order.service.ts`, `import { purchaseOrderRepository } from '../repositories/purchase-order.repository';
import { CreatePurchaseOrderInput, UpdatePurchaseOrderInput, PurchaseOrderSearchInput } from '../validators/purchase-order.validator';
import { NotFoundError, ConflictError } from '@/shared/errors/AppError';

export class PurchaseOrderService {
  async getAll(companyId: string, search: PurchaseOrderSearchInput) {
    const where: any = { deletedAt: null };
    if (search.q) where.orderNumber = { contains: search.q, mode: 'insensitive' };
    if (search.status) where.status = search.status;
    if (search.supplierId) where.supplierId = search.supplierId;
    return purchaseOrderRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
    });
  }

  async getById(id: string, companyId: string) {
    const order = await purchaseOrderRepository.findById(id, companyId);
    if (!order) throw new NotFoundError('Purchase order not found');
    return order;
  }

  async create(companyId: string, data: CreatePurchaseOrderInput) {
    const existing = await purchaseOrderRepository.findAll(companyId, { where: { orderNumber: data.orderNumber, deletedAt: null }, take: 1 });
    if (existing.total > 0) throw new ConflictError('Order number already exists');
    const { items, ...orderData } = data;
    return purchaseOrderRepository.create(
      { ...orderData, company: { connect: { id: companyId } } } as any,
      items.map(item => ({ ...item }))
    );
  }

  async update(id: string, companyId: string, data: UpdatePurchaseOrderInput) {
    await this.getById(id, companyId);
    await purchaseOrderRepository.update(id, companyId, data);
    return this.getById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return purchaseOrderRepository.delete(id, companyId);
  }
}

export const purchaseOrderService = new PurchaseOrderService();
`);

writeFile(`${BASE}/purchase-order/controllers/purchase-order.controller.ts`, sc('purchase-order') + `

export class PurchaseOrderController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = (await import('../validators/purchase-order.validator')).purchaseOrderSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await purchaseOrderService.getAll(companyId, search); return successResponse(result); }
    catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) {
    try { const order = await purchaseOrderService.getById(id, companyId); return successResponse(order); }
    catch (error) { return errorResponse(error as Error); }
  }
  async create(req: NextRequest, companyId: string) {
    try { const body = await req.json(); const data = (await import('../validators/purchase-order.validator')).createPurchaseOrderSchema.parse(body); const order = await purchaseOrderService.create(companyId, data); return successResponse(order, 201); }
    catch (error) { return errorResponse(error as Error); }
  }
  async update(req: NextRequest, companyId: string, id: string) {
    try { const body = await req.json(); const data = (await import('../validators/purchase-order.validator')).updatePurchaseOrderSchema.parse(body); const order = await purchaseOrderService.update(id, companyId, data); return successResponse(order); }
    catch (error) { return errorResponse(error as Error); }
  }
  async delete(req: NextRequest, companyId: string, id: string) {
    try { await purchaseOrderService.delete(id, companyId); return successResponse({ message: 'Purchase order deleted' }); }
    catch (error) { return errorResponse(error as Error); }
  }
}

export const purchaseOrderController = new PurchaseOrderController();
`);

// ========== WAREHOUSE-TRANSFER MODULE ==========
writeFile(`${BASE}/warehouse-transfer/validators/warehouse-transfer.validator.ts`, `import { z } from 'zod';
import { WarehouseTransferStatus } from '@prisma/client';

export const createWarehouseTransferSchema = z.object({
  transferNumber: z.string().min(1).max(50),
  sourceWarehouseId: z.string().uuid(),
  destinationWarehouseId: z.string().uuid(),
  status: z.nativeEnum(WarehouseTransferStatus).default(WarehouseTransferStatus.DRAFT),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    partId: z.string().uuid().optional().nullable(),
    quantity: z.number().int().positive(),
    notes: z.string().optional().nullable(),
  })).default([]),
});

export const updateWarehouseTransferSchema = createWarehouseTransferSchema.partial();

export const warehouseTransferSearchSchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(WarehouseTransferStatus).optional(),
  sourceWarehouseId: z.string().uuid().optional(),
  destinationWarehouseId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateWarehouseTransferInput = z.infer<typeof createWarehouseTransferSchema>;
export type UpdateWarehouseTransferInput = z.infer<typeof updateWarehouseTransferSchema>;
export type WarehouseTransferSearchInput = z.infer<typeof warehouseTransferSearchSchema>;
`);

writeFile(`${BASE}/warehouse-transfer/repositories/warehouse-transfer.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class WarehouseTransferRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.WarehouseTransferWhereInput; orderBy?: Prisma.WarehouseTransferOrderByWithRelationInput } = {}) {
    const [transfers, total] = await Promise.all([
      prisma.warehouseTransfer.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: {
          sourceWarehouse: { select: { id: true, name: true, code: true } },
          destinationWarehouse: { select: { id: true, name: true, code: true } },
          items: { include: { part: { select: { id: true, name: true, partNumber: true } } } },
        },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.warehouseTransfer.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { transfers, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.warehouseTransfer.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { sourceWarehouse: true, destinationWarehouse: true, items: { include: { part: true } } },
    });
  }

  async create(data: Prisma.WarehouseTransferCreateInput, items: Prisma.WarehouseTransferItemCreateManyWarehouseTransferInput[]) {
    return prisma.warehouseTransfer.create({
      data: { ...data, items: { createMany: { data: items } } },
      include: { sourceWarehouse: true, destinationWarehouse: true, items: { include: { part: true } } },
    });
  }

  async update(id: string, companyId: string, data: Prisma.WarehouseTransferUpdateInput) {
    return prisma.warehouseTransfer.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.warehouseTransfer.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const warehouseTransferRepository = new WarehouseTransferRepository();
`);

writeFile(`${BASE}/warehouse-transfer/services/warehouse-transfer.service.ts`, `import { warehouseTransferRepository } from '../repositories/warehouse-transfer.repository';
import { CreateWarehouseTransferInput, UpdateWarehouseTransferInput, WarehouseTransferSearchInput } from '../validators/warehouse-transfer.validator';
import { NotFoundError, ConflictError, BadRequestError } from '@/shared/errors/AppError';

export class WarehouseTransferService {
  async getAll(companyId: string, search: WarehouseTransferSearchInput) {
    const where: any = { deletedAt: null };
    if (search.q) where.transferNumber = { contains: search.q, mode: 'insensitive' };
    if (search.status) where.status = search.status;
    if (search.sourceWarehouseId) where.sourceWarehouseId = search.sourceWarehouseId;
    if (search.destinationWarehouseId) where.destinationWarehouseId = search.destinationWarehouseId;
    return warehouseTransferRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
    });
  }

  async getById(id: string, companyId: string) {
    const transfer = await warehouseTransferRepository.findById(id, companyId);
    if (!transfer) throw new NotFoundError('Transfer not found');
    return transfer;
  }

  async create(companyId: string, data: CreateWarehouseTransferInput) {
    if (data.sourceWarehouseId === data.destinationWarehouseId) throw new BadRequestError('Source and destination warehouses must be different');
    const existing = await warehouseTransferRepository.findAll(companyId, { where: { transferNumber: data.transferNumber, deletedAt: null }, take: 1 });
    if (existing.total > 0) throw new ConflictError('Transfer number already exists');
    const { items, ...transferData } = data;
    return warehouseTransferRepository.create(
      { ...transferData, company: { connect: { id: companyId } }, sourceWarehouse: { connect: { id: data.sourceWarehouseId } }, destinationWarehouse: { connect: { id: data.destinationWarehouseId } } } as any,
      items.map(item => ({ ...item }))
    );
  }

  async update(id: string, companyId: string, data: UpdateWarehouseTransferInput) {
    await this.getById(id, companyId);
    if (data.sourceWarehouseId && data.destinationWarehouseId && data.sourceWarehouseId === data.destinationWarehouseId) {
      throw new BadRequestError('Source and destination warehouses must be different');
    }
    await warehouseTransferRepository.update(id, companyId, data);
    return this.getById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return warehouseTransferRepository.delete(id, companyId);
  }
}

export const warehouseTransferService = new WarehouseTransferService();
`);

writeFile(`${BASE}/warehouse-transfer/controllers/warehouse-transfer.controller.ts`, sc('warehouse-transfer') + `

export class WarehouseTransferController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = (await import('../validators/warehouse-transfer.validator')).warehouseTransferSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await warehouseTransferService.getAll(companyId, search); return successResponse(result); }
    catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) {
    try { const transfer = await warehouseTransferService.getById(id, companyId); return successResponse(transfer); }
    catch (error) { return errorResponse(error as Error); }
  }
  async create(req: NextRequest, companyId: string) {
    try { const body = await req.json(); const data = (await import('../validators/warehouse-transfer.validator')).createWarehouseTransferSchema.parse(body); const transfer = await warehouseTransferService.create(companyId, data); return successResponse(transfer, 201); }
    catch (error) { return errorResponse(error as Error); }
  }
  async update(req: NextRequest, companyId: string, id: string) {
    try { const body = await req.json(); const data = (await import('../validators/warehouse-transfer.validator')).updateWarehouseTransferSchema.parse(body); const transfer = await warehouseTransferService.update(id, companyId, data); return successResponse(transfer); }
    catch (error) { return errorResponse(error as Error); }
  }
  async delete(req: NextRequest, companyId: string, id: string) {
    try { await warehouseTransferService.delete(id, companyId); return successResponse({ message: 'Transfer deleted' }); }
    catch (error) { return errorResponse(error as Error); }
  }
}

export const warehouseTransferController = new WarehouseTransferController();
`);

// ========== INVENTORY-ALERT MODULE ==========
writeFile(`${BASE}/inventory-alert/validators/inventory-alert.validator.ts`, `import { z } from 'zod';

export const createInventoryAlertSchema = z.object({
  alertType: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  partId: z.string().uuid().optional().nullable(),
  warehouseId: z.string().uuid().optional().nullable(),
  purchaseOrderId: z.string().uuid().optional().nullable(),
});

export const inventoryAlertSearchSchema = z.object({
  alertType: z.string().optional(),
  isRead: z.coerce.boolean().optional(),
  isResolved: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateInventoryAlertInput = z.infer<typeof createInventoryAlertSchema>;
export type InventoryAlertSearchInput = z.infer<typeof inventoryAlertSearchSchema>;
`);

writeFile(`${BASE}/inventory-alert/repositories/inventory-alert.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class InventoryAlertRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.InventoryAlertWhereInput; orderBy?: Prisma.InventoryAlertOrderByWithRelationInput } = {}) {
    const [alerts, total] = await Promise.all([
      prisma.inventoryAlert.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: { warehouse: { select: { id: true, name: true } } },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.inventoryAlert.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { alerts, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.inventoryAlert.findFirst({ where: { id, companyId, deletedAt: null }, include: { warehouse: true } });
  }

  async create(data: Prisma.InventoryAlertCreateInput) {
    return prisma.inventoryAlert.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.InventoryAlertUpdateInput) {
    return prisma.inventoryAlert.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.inventoryAlert.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }

  async countUnread(companyId: string) {
    return prisma.inventoryAlert.count({ where: { companyId, deletedAt: null, isRead: false } });
  }
}

export const inventoryAlertRepository = new InventoryAlertRepository();
`);

writeFile(`${BASE}/inventory-alert/services/inventory-alert.service.ts`, `import { inventoryAlertRepository } from '../repositories/inventory-alert.repository';
import { CreateInventoryAlertInput, InventoryAlertSearchInput } from '../validators/inventory-alert.validator';
import { NotFoundError } from '@/shared/errors/AppError';

export class InventoryAlertService {
  async getAll(companyId: string, search: InventoryAlertSearchInput) {
    const where: any = { deletedAt: null };
    if (search.alertType) where.alertType = search.alertType;
    if (search.isRead !== undefined) where.isRead = search.isRead;
    if (search.isResolved !== undefined) where.isResolved = search.isResolved;
    return inventoryAlertRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
    });
  }

  async getById(id: string, companyId: string) {
    const alert = await inventoryAlertRepository.findById(id, companyId);
    if (!alert) throw new NotFoundError('Alert not found');
    return alert;
  }

  async create(companyId: string, data: CreateInventoryAlertInput) {
    return inventoryAlertRepository.create({ ...data, company: { connect: { id: companyId } } } as any);
  }

  async markAsRead(id: string, companyId: string) {
    await this.getById(id, companyId);
    await inventoryAlertRepository.update(id, companyId, { isRead: true });
    return this.getById(id, companyId);
  }

  async resolve(id: string, companyId: string) {
    await this.getById(id, companyId);
    await inventoryAlertRepository.update(id, companyId, { isResolved: true, isRead: true });
    return this.getById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return inventoryAlertRepository.delete(id, companyId);
  }

  async getUnreadCount(companyId: string) {
    return inventoryAlertRepository.countUnread(companyId);
  }
}

export const inventoryAlertService = new InventoryAlertService();
`);

writeFile(`${BASE}/inventory-alert/controllers/inventory-alert.controller.ts`, sc('inventory-alert') + `

export class InventoryAlertController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = (await import('../validators/inventory-alert.validator')).inventoryAlertSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await inventoryAlertService.getAll(companyId, search); return successResponse(result); }
    catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) {
    try { const alert = await inventoryAlertService.getById(id, companyId); return successResponse(alert); }
    catch (error) { return errorResponse(error as Error); }
  }
  async create(req: NextRequest, companyId: string) {
    try { const body = await req.json(); const data = (await import('../validators/inventory-alert.validator')).createInventoryAlertSchema.parse(body); const alert = await inventoryAlertService.create(companyId, data); return successResponse(alert, 201); }
    catch (error) { return errorResponse(error as Error); }
  }
  async markAsRead(req: NextRequest, companyId: string, id: string) {
    try { const alert = await inventoryAlertService.markAsRead(id, companyId); return successResponse(alert); }
    catch (error) { return errorResponse(error as Error); }
  }
  async resolve(req: NextRequest, companyId: string, id: string) {
    try { const alert = await inventoryAlertService.resolve(id, companyId); return successResponse(alert); }
    catch (error) { return errorResponse(error as Error); }
  }
  async delete(req: NextRequest, companyId: string, id: string) {
    try { await inventoryAlertService.delete(id, companyId); return successResponse({ message: 'Alert deleted' }); }
    catch (error) { return errorResponse(error as Error); }
  }
  async unreadCount(req: NextRequest, companyId: string) {
    try { const count = await inventoryAlertService.getUnreadCount(companyId); return successResponse({ count }); }
    catch (error) { return errorResponse(error as Error); }
  }
}

export const inventoryAlertController = new InventoryAlertController();
`);

// ========== INVENTORY-ANALYTICS MODULE ==========
writeFile(`${BASE}/inventory-analytics/services/inventory-analytics.service.ts`, `import { prisma } from '@/lib/prisma';

export class InventoryAnalyticsService {
  async getOverview(companyId: string) {
    const [totalParts, totalWarehouses, totalSuppliers, totalTools, lowStockCount, pendingOrders, totalStockValue] = await Promise.all([
      prisma.inventoryPart.count({ where: { companyId, deletedAt: null } }),
      prisma.warehouse.count({ where: { companyId, deletedAt: null } }),
      prisma.supplier.count({ where: { companyId, deletedAt: null } }),
      prisma.tool.count({ where: { companyId, deletedAt: null } }),
      prisma.stock.count({ where: { companyId, deletedAt: null, quantity: { lte: { part: { minimumStock: { gt: 0 } } } } } }),
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
`);

writeFile(`${BASE}/inventory-analytics/controllers/inventory-analytics.controller.ts`, `import { NextRequest, NextResponse } from 'next/server';
import { inventoryAnalyticsService } from '../services/inventory-analytics.service';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class InventoryAnalyticsController {
  async overview(req: NextRequest, companyId: string) {
    try { const data = await inventoryAnalyticsService.getOverview(companyId); return successResponse(data); }
    catch (error) { return errorResponse(error as Error); }
  }
  async stockValue(req: NextRequest, companyId: string) {
    try { const data = await inventoryAnalyticsService.getStockValueByWarehouse(companyId); return successResponse(data); }
    catch (error) { return errorResponse(error as Error); }
  }
  async topMoving(req: NextRequest, companyId: string) {
    try { const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10'); const data = await inventoryAnalyticsService.getTopMovingParts(companyId, limit); return successResponse(data); }
    catch (error) { return errorResponse(error as Error); }
  }
}

export const inventoryAnalyticsController = new InventoryAnalyticsController();
`);

console.log('All remaining modules created: stock-movement, purchase-order, warehouse-transfer, inventory-alert, inventory-analytics');
