import { NextRequest, NextResponse } from 'next/server';
import { inventoryAlertService } from '../services/inventory-alert.service';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

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
