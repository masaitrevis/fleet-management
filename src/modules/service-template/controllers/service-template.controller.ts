import { NextRequest, NextResponse } from 'next/server';
import { serviceTemplateService } from '../services/service-template.service';
import {
  createServiceTemplateSchema,
  updateServiceTemplateSchema,
  serviceTemplateSearchSchema,
  serviceTemplateItemSchema,
} from '../validators/service-template.validator';
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

export class ServiceTemplateController {
  async getAll(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const searchInput = serviceTemplateSearchSchema.parse({
        q: searchParams.get('q') || undefined,
        templateType: searchParams.get('templateType') || undefined,
        isActive: searchParams.get('isActive') || undefined,
        page: Number(searchParams.get('page') || '1'),
        limit: Number(searchParams.get('limit') || '50'),
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      });
      const result = await serviceTemplateService.getAll(companyId, searchInput);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getById(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await serviceTemplateService.getById(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async create(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const body = await req.json();
      const { items, ...templateData } = body;
      const data = createServiceTemplateSchema.parse(templateData);
      let result;
      if (items && Array.isArray(items) && items.length > 0) {
        const parsedItems = items.map((item: any) => serviceTemplateItemSchema.parse(item));
        result = await serviceTemplateService.createWithItems(companyId, data, parsedItems);
      } else {
        result = await serviceTemplateService.create(companyId, data);
      }
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async update(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const body = await req.json();
      const data = updateServiceTemplateSchema.parse(body);
      const result = await serviceTemplateService.update(params.id, companyId, data);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async delete(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await serviceTemplateService.delete(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async addItem(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const body = await req.json();
      const item = serviceTemplateItemSchema.parse(body);
      const result = await serviceTemplateService.addItem(params.id, companyId, item);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const serviceTemplateController = new ServiceTemplateController();
