import { NextRequest, NextResponse } from 'next/server';
import { trackingService } from '../services/tracking.service';
import { locationUpdateSchema, locationSearchSchema, boundsSchema } from '../validators/tracking.validator';
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

export class TrackingController {
  async getAllLiveVehicles(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await trackingService.getLatestLocations(companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getVehicleLiveLocation(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await trackingService.getLatestByVehicle(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async postLocation(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const body = await req.json();
      const data = locationUpdateSchema.parse(body);
      const result = await trackingService.processLocationUpdate(companyId, data);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getVehicleHistory(req: NextRequest, { params }: { params: { vehicleId: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const search = locationSearchSchema.parse({
        startTime: searchParams.get('startTime') || undefined,
        endTime: searchParams.get('endTime') || undefined,
        page: Number(searchParams.get('page') || '1'),
        limit: Number(searchParams.get('limit') || '100'),
      });
      const result = await trackingService.getVehicleHistory(
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

  async getLocationsInBounds(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const bounds = boundsSchema.parse({
        north: Number(searchParams.get('north')),
        south: Number(searchParams.get('south')),
        east: Number(searchParams.get('east')),
        west: Number(searchParams.get('west')),
      });
      const result = await trackingService.getLocationsWithinBounds(companyId, bounds.north, bounds.south, bounds.east, bounds.west);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const trackingController = new TrackingController();
