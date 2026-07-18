import { NextRequest, NextResponse } from 'next/server';
import { toolService } from '../services/tool.service';
import { createToolSchema, updateToolSchema, toolSearchSchema } from '../validators/tool.validator';
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

export class ToolController {
  async getAll(req: NextRequest, companyId: string) {
    try {
      const search = toolSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
      const result = await toolService.getAll(companyId, search);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getById(req: NextRequest, companyId: string, id: string) {
    try {
      const item = await toolService.getById(id, companyId);
      return successResponse(item);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async create(req: NextRequest, companyId: string) {
    try {
      const body = await req.json();
      const data = createToolSchema.parse(body);
      const item = await toolService.create(companyId, data);
      return successResponse(item, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async update(req: NextRequest, companyId: string, id: string) {
    try {
      const body = await req.json();
      const data = updateToolSchema.parse(body);
      const item = await toolService.update(id, companyId, data);
      return successResponse(item);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async delete(req: NextRequest, companyId: string, id: string) {
    try {
      await toolService.delete(id, companyId);
      return successResponse({ message: 'Deleted successfully' });
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const toolController = new ToolController();
