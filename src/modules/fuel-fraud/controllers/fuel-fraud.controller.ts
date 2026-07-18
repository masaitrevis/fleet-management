import { NextRequest, NextResponse } from 'next/server';
import { fuelFraudService } from '../services/fuel-fraud.service';
import {
  updateFraudStatusSchema,
  fuelFraudSearchSchema,
} from '../validators/fuel-fraud.validator';
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

export class FuelFraudController {
  async getAll(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const searchInput = fuelFraudSearchSchema.parse({
        q: searchParams.get('q') || undefined,
        status: searchParams.get('status') || undefined,
        fraudType: searchParams.get('fraudType') || undefined,
        vehicleId: searchParams.get('vehicleId') || undefined,
        page: Number(searchParams.get('page') || '1'),
        limit: Number(searchParams.get('limit') || '50'),
        sortBy: searchParams.get('sortBy') || 'detectedAt',
        sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      });
      const result = await fuelFraudService.getAll(companyId, searchInput);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getById(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await fuelFraudService.getById(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async updateStatus(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = updateFraudStatusSchema.parse(body);
      const result = await fuelFraudService.updateStatus(params.id, companyId, data, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getStats(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await fuelFraudService.getStats(companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const fuelFraudController = new FuelFraudController();
