import { NextRequest, NextResponse } from 'next/server';
import { stockService } from '../services/stock.service';
import { createStockSchema, updateStockSchema, stockSearchSchema } from '../validators/stock.validator';
import { AppError } from '@/shared/errors/AppError';


function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.statusCode }
    );
  }
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
    { status: 500 }
  );
}

export class StockController {
  async getAll(req: NextRequest, companyId: string) {
    try {
      const search = stockSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
      const result = await stockService.getAll(companyId, search);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getById(req: NextRequest, companyId: string, id: string) {
    try {
      const item = await stockService.getById(id, companyId);
      return successResponse(item);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async create(req: NextRequest, companyId: string) {
    try {
      const body = await req.json();
      const data = createStockSchema.parse(body);
      const item = await stockService.create(companyId, data);
      return successResponse(item, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async update(req: NextRequest, companyId: string, id: string) {
    try {
      const body = await req.json();
      const data = updateStockSchema.parse(body);
      const item = await stockService.update(id, companyId, data);
      return successResponse(item);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async delete(req: NextRequest, companyId: string, id: string) {
    try {
      await stockService.delete(id, companyId);
      return successResponse({ message: 'Deleted successfully' });
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const stockController = new StockController();
