import { NextRequest, NextResponse } from 'next/server';
import { fuelAnalyticsService } from '../services/fuel-analytics.service';
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

export class FuelAnalyticsController {
  async getOverview(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const result = await fuelAnalyticsService.getOverview(
        companyId,
        searchParams.get('startDate') || undefined,
        searchParams.get('endDate') || undefined
      );
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getVehicleStats(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const result = await fuelAnalyticsService.getVehicleStats(companyId, searchParams.get('vehicleId') || undefined);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getDriverStats(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const result = await fuelAnalyticsService.getDriverStats(companyId, searchParams.get('driverId') || undefined);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getTrends(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const result = await fuelAnalyticsService.getTrends(
        companyId,
        (searchParams.get('period') as any) || 'daily',
        searchParams.get('startDate') || undefined,
        searchParams.get('endDate') || undefined
      );
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getEfficiency(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await fuelAnalyticsService.getEfficiencyRankings(companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const fuelAnalyticsController = new FuelAnalyticsController();
