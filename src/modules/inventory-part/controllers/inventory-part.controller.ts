import { NextRequest, NextResponse } from 'next/server';
import { inventoryPartService } from '../services/inventory-part.service';
import { createInventoryPartSchema, updateInventoryPartSchema, inventoryPartSearchSchema } from '../validators/inventory-part.validator';
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

export class InventoryPartController {
  async getAll(req: NextRequest, companyId: string) {
    try {
      const search = inventoryPartSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
      const result = await inventoryPartService.getAll(companyId, search);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getById(req: NextRequest, companyId: string, id: string) {
    try {
      const item = await inventoryPartService.getById(id, companyId);
      return successResponse(item);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async create(req: NextRequest, companyId: string) {
    try {
      const body = await req.json();
      const data = createInventoryPartSchema.parse(body);
      const item = await inventoryPartService.create(companyId, data);
      return successResponse(item, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async update(req: NextRequest, companyId: string, id: string) {
    try {
      const body = await req.json();
      const data = updateInventoryPartSchema.parse(body);
      const item = await inventoryPartService.update(id, companyId, data);
      return successResponse(item);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async delete(req: NextRequest, companyId: string, id: string) {
    try {
      await inventoryPartService.delete(id, companyId);
      return successResponse({ message: 'Deleted successfully' });
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const inventorypartController = new InventoryPartController();
