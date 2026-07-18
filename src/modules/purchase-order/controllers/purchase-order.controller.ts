import { NextRequest, NextResponse } from 'next/server';
import { purchaseOrderService } from '../services/purchase-order.service';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

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
