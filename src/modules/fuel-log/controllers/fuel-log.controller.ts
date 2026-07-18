import { NextRequest, NextResponse } from 'next/server';
import { fuelLogService } from '../services/fuel-log.service';
import {
  createFuelLogSchema,
  updateFuelLogSchema,
  fuelLogSearchSchema,
  bulkFuelLogSchema,
} from '../validators/fuel-log.validator';
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

export class FuelLogController {
  async getAll(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const searchInput = fuelLogSearchSchema.parse({
        q: searchParams.get('q') || undefined,
        vehicleId: searchParams.get('vehicleId') || undefined,
        driverId: searchParams.get('driverId') || undefined,
        status: searchParams.get('status') || undefined,
        fuelType: searchParams.get('fuelType') || undefined,
        paymentMethod: searchParams.get('paymentMethod') || undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        page: Number(searchParams.get('page') || '1'),
        limit: Number(searchParams.get('limit') || '50'),
        sortBy: searchParams.get('sortBy') || 'fuelDate',
        sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      });
      const result = await fuelLogService.getAll(companyId, searchInput);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getById(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await fuelLogService.getById(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async create(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = createFuelLogSchema.parse(body);
      const result = await fuelLogService.create(companyId, data, userId);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async update(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = updateFuelLogSchema.parse(body);
      const result = await fuelLogService.update(params.id, companyId, data, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async delete(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const result = await fuelLogService.delete(params.id, companyId, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async bulkImport(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = bulkFuelLogSchema.parse(body);
      const result = await fuelLogService.bulkImport(companyId, data.logs, userId);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const fuelLogController = new FuelLogController();
