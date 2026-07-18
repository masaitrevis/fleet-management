import { NextRequest, NextResponse } from 'next/server';
import { workOrderService } from '../services/work-order.service';
import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
  workOrderSearchSchema,
  assignWorkOrderSchema,
  approveWorkOrderSchema,
  updateWorkOrderStatusSchema,
} from '../validators/work-order.validator';
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

export class WorkOrderController {
  async getAll(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const searchInput = workOrderSearchSchema.parse({
        q: searchParams.get('q') || undefined,
        vehicleId: searchParams.get('vehicleId') || undefined,
        mechanicId: searchParams.get('mechanicId') || undefined,
        status: searchParams.get('status') || undefined,
        jobType: searchParams.get('jobType') || undefined,
        priority: searchParams.get('priority') || undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        page: Number(searchParams.get('page') || '1'),
        limit: Number(searchParams.get('limit') || '50'),
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      });
      const result = await workOrderService.getAll(companyId, searchInput);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getById(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await workOrderService.getById(params.id, companyId);
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
      const data = createWorkOrderSchema.parse(body);
      const result = await workOrderService.create(companyId, data, userId);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async update(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const body = await req.json();
      const data = updateWorkOrderSchema.parse(body);
      const result = await workOrderService.update(params.id, companyId, data);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async delete(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await workOrderService.delete(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async assign(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const body = await req.json();
      const data = assignWorkOrderSchema.parse(body);
      const result = await workOrderService.assign(params.id, companyId, data);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async approve(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = approveWorkOrderSchema.parse(body);
      const result = await workOrderService.approve(params.id, companyId, data, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async updateStatus(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const body = await req.json();
      const data = updateWorkOrderStatusSchema.parse(body);
      const result = await workOrderService.updateStatus(params.id, companyId, data);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const workOrderController = new WorkOrderController();
