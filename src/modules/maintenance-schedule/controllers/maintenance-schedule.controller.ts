import { NextRequest, NextResponse } from 'next/server';
import { maintenanceScheduleService } from '../services/maintenance-schedule.service';
import {
  createMaintenanceScheduleSchema,
  updateMaintenanceScheduleSchema,
  maintenanceScheduleSearchSchema,
} from '../validators/maintenance-schedule.validator';
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

export class MaintenanceScheduleController {
  async getAll(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const searchInput = maintenanceScheduleSearchSchema.parse({
        q: searchParams.get('q') || undefined,
        vehicleId: searchParams.get('vehicleId') || undefined,
        scheduleType: searchParams.get('scheduleType') || undefined,
        isActive: searchParams.get('isActive') || undefined,
        page: Number(searchParams.get('page') || '1'),
        limit: Number(searchParams.get('limit') || '50'),
        sortBy: searchParams.get('sortBy') || 'nextDueDate',
        sortOrder: (searchParams.get('sortOrder') as any) || 'asc',
      });
      const result = await maintenanceScheduleService.getAll(companyId, searchInput);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getById(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await maintenanceScheduleService.getById(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async create(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const body = await req.json();
      const data = createMaintenanceScheduleSchema.parse(body);
      const result = await maintenanceScheduleService.create(companyId, data);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async update(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const body = await req.json();
      const data = updateMaintenanceScheduleSchema.parse(body);
      const result = await maintenanceScheduleService.update(params.id, companyId, data);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async delete(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await maintenanceScheduleService.delete(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getOverdue(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await maintenanceScheduleService.getOverdue(companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const maintenanceScheduleController = new MaintenanceScheduleController();
