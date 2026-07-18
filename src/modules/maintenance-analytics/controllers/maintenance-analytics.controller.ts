import { NextRequest, NextResponse } from 'next/server';
import { maintenanceAnalyticsService } from '../services/maintenance-analytics.service';
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

export class MaintenanceAnalyticsController {
  async getOverview(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await maintenanceAnalyticsService.getOverview(companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getCosts(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
      const result = await maintenanceAnalyticsService.getCosts(companyId, startDate, endDate);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getDowntime(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
      const result = await maintenanceAnalyticsService.getDowntime(companyId, startDate, endDate);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getOverdue(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await maintenanceAnalyticsService.getOverdue(companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getMechanicPerformance(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await maintenanceAnalyticsService.getMechanicPerformance(companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const maintenanceAnalyticsController = new MaintenanceAnalyticsController();
