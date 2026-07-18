import { NextRequest, NextResponse } from 'next/server';
import { warehouseTransferService } from '../services/warehouse-transfer.service';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

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
