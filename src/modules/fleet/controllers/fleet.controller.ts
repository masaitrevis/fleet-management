import { NextRequest, NextResponse } from 'next/server';
import { fleetService } from '../services/fleet.service';
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

export class FleetController {
  async getAvailability(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await fleetService.getAvailability(companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getAssignmentsByStatus(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await fleetService.getAssignmentsByStatus(companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const fleetController = new FleetController();
