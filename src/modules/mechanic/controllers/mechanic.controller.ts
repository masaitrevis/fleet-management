import { NextRequest, NextResponse } from 'next/server';
import { mechanicService } from '../services/mechanic.service';
import {
  createMechanicSchema,
  updateMechanicSchema,
  mechanicSearchSchema,
} from '../validators/mechanic.validator';
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

export class MechanicController {
  async getAll(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const searchInput = mechanicSearchSchema.parse({
        q: searchParams.get('q') || undefined,
        status: searchParams.get('status') || undefined,
        skill: searchParams.get('skill') || undefined,
        page: Number(searchParams.get('page') || '1'),
        limit: Number(searchParams.get('limit') || '50'),
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      });
      const result = await mechanicService.getAll(companyId, searchInput);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getById(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await mechanicService.getById(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async create(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const body = await req.json();
      const data = createMechanicSchema.parse(body);
      const result = await mechanicService.create(companyId, data);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async update(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const body = await req.json();
      const data = updateMechanicSchema.parse(body);
      const result = await mechanicService.update(params.id, companyId, data);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async delete(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await mechanicService.delete(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getJobs(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await mechanicService.getJobs(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const mechanicController = new MechanicController();
