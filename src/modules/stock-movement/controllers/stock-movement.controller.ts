import { NextRequest, NextResponse } from 'next/server';
import { stockMovementService } from '../services/stock-movement.service';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

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
