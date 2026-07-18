import { NextRequest, NextResponse } from 'next/server';
import { telemetryService } from '../services/telemetry.service';
import { telemetryPointSchema, telemetryBatchSchema, telemetrySearchSchema } from '../validators/telemetry.validator';
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

export class TelemetryController {
  async getByVehicle(req: NextRequest, { params }: { params: { vehicleId: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const search = telemetrySearchSchema.parse({
        startTime: searchParams.get('startTime') || undefined,
        endTime: searchParams.get('endTime') || undefined,
        page: Number(searchParams.get('page') || '1'),
        limit: Number(searchParams.get('limit') || '100'),
      });
      const result = await telemetryService.getTelemetry(
        params.vehicleId,
        companyId,
        search.startTime ? new Date(search.startTime) : undefined,
        search.endTime ? new Date(search.endTime) : undefined,
        search.page,
        search.limit
      );
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async postTelemetry(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const body = await req.json();
      // Try batch first
      if (body.points) {
        const data = telemetryBatchSchema.parse(body);
        const result = await telemetryService.storeBatch(companyId, data);
        return successResponse({ inserted: result.count }, 201);
      }
      const data = telemetryPointSchema.parse(body);
      const result = await telemetryService.storeTelemetry(companyId, data);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getStats(req: NextRequest, { params }: { params: { vehicleId: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const startTime = searchParams.get('startTime') ? new Date(searchParams.get('startTime')!) : undefined;
      const endTime = searchParams.get('endTime') ? new Date(searchParams.get('endTime')!) : undefined;
      const result = await telemetryService.getStats(params.vehicleId, companyId, startTime, endTime);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const telemetryController = new TelemetryController();
