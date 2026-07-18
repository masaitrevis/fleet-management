import { NextRequest, NextResponse } from 'next/server';
import { vehicleDowntimeService } from '../services/vehicle-downtime.service';
import {
  createVehicleDowntimeSchema,
  updateVehicleDowntimeSchema,
  vehicleDowntimeSearchSchema,
} from '../validators/vehicle-downtime.validator';
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

export class VehicleDowntimeController {
  async getAll(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const searchInput = vehicleDowntimeSearchSchema.parse({
        q: searchParams.get('q') || undefined,
        vehicleId: searchParams.get('vehicleId') || undefined,
        reason: searchParams.get('reason') || undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        page: Number(searchParams.get('page') || '1'),
        limit: Number(searchParams.get('limit') || '50'),
        sortBy: searchParams.get('sortBy') || 'startDate',
        sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      });
      const result = await vehicleDowntimeService.getAll(companyId, searchInput);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getById(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await vehicleDowntimeService.getById(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async create(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const body = await req.json();
      const data = createVehicleDowntimeSchema.parse(body);
      const result = await vehicleDowntimeService.create(companyId, data);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async update(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const body = await req.json();
      const data = updateVehicleDowntimeSchema.parse(body);
      const result = await vehicleDowntimeService.update(params.id, companyId, data);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async delete(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await vehicleDowntimeService.delete(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const vehicleDowntimeController = new VehicleDowntimeController();
