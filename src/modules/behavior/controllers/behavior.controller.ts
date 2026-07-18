import { NextRequest, NextResponse } from 'next/server';
import { behaviorService } from '../services/behavior.service';
import { behaviorPeriodSchema } from '../validators/behavior.validator';
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

export class BehaviorController {
  async getByDriver(req: NextRequest, { params }: { params: { driverId: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const period = behaviorPeriodSchema.parse({
        startTime: searchParams.get('startTime') || undefined,
        endTime: searchParams.get('endTime') || undefined,
      });
      const result = await behaviorService.getByDriver(params.driverId, companyId, period);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getPeriods(req: NextRequest, { params }: { params: { driverId: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await behaviorService.getPeriods(params.driverId, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const behaviorController = new BehaviorController();
