import { NextRequest, NextResponse } from 'next/server';
import { tripService } from '../services/trip.service';
import {
  createTripSchema,
  updateTripSchema,
  tripSearchSchema,
  startTripSchema,
  pauseTripSchema,
  resumeTripSchema,
  completeTripSchema,
  cancelTripSchema,
  updateTripChecklistSchema,
  tripInspectionInputSchema,
} from '../validators/trip.validator';
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

export class TripController {
  async getAll(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const searchInput = tripSearchSchema.parse({
        q: searchParams.get('q') || undefined,
        status: searchParams.get('status') || undefined,
        vehicleId: searchParams.get('vehicleId') || undefined,
        driverId: searchParams.get('driverId') || undefined,
        priority: searchParams.get('priority') || undefined,
        page: Number(searchParams.get('page') || '1'),
        limit: Number(searchParams.get('limit') || '50'),
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      });
      const result = await tripService.getAll(companyId, searchInput);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getById(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await tripService.getById(params.id, companyId);
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
      const data = createTripSchema.parse(body);
      const result = await tripService.create(companyId, data, userId);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async update(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = updateTripSchema.parse(body);
      const result = await tripService.update(params.id, companyId, data, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async delete(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const result = await tripService.delete(params.id, companyId, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async startTrip(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = startTripSchema.parse(body);
      const result = await tripService.startTrip(params.id, companyId, data, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async pauseTrip(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = pauseTripSchema.parse(body);
      const result = await tripService.pauseTrip(params.id, companyId, data, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async resumeTrip(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = resumeTripSchema.parse(body);
      const result = await tripService.resumeTrip(params.id, companyId, data, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async completeTrip(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = completeTripSchema.parse(body);
      const result = await tripService.completeTrip(params.id, companyId, data, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async cancelTrip(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = cancelTripSchema.parse(body);
      const result = await tripService.cancelTrip(params.id, companyId, data, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getTimeline(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await tripService.getTimeline(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getChecklist(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await tripService.getChecklist(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async updateChecklist(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = updateTripChecklistSchema.parse(body);
      const result = await tripService.updateChecklist(params.id, companyId, data, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getInspections(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await tripService.getInspections(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async createInspection(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = tripInspectionInputSchema.parse(body);
      const result = await tripService.createInspection(params.id, companyId, data, userId);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getFilters(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await tripService.getFilters(companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const tripController = new TripController();
