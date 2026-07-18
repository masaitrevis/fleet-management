import { NextRequest, NextResponse } from 'next/server';
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
