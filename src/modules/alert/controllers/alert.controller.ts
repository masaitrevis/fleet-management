import { NextRequest, NextResponse } from 'next/server';
import { alertService } from '../services/alert.service';
import { alertSearchSchema, createAlertSchema, resolveAlertSchema } from '../validators/alert.validator';
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

export class AlertController {
  async getAll(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const searchInput = alertSearchSchema.parse({
        q: searchParams.get('q') || undefined,
        alertType: searchParams.get('alertType') || undefined,
        severity: searchParams.get('severity') || undefined,
        status: searchParams.get('status') || undefined,
        vehicleId: searchParams.get('vehicleId') || undefined,
        page: Number(searchParams.get('page') || '1'),
        limit: Number(searchParams.get('limit') || '50'),
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      });
      const result = await alertService.getAll(companyId, searchInput);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getById(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await alertService.getById(params.id, companyId);
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
      const data = createAlertSchema.parse(body);
      const result = await alertService.create(companyId, data, userId);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async acknowledge(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const result = await alertService.acknowledge(params.id, companyId, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async resolve(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = resolveAlertSchema.parse(body);
      const result = await alertService.resolve(params.id, companyId, userId, data);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async dismiss(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const result = await alertService.dismiss(params.id, companyId, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const alertController = new AlertController();
