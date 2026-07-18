import { NextRequest, NextResponse } from 'next/server';
import { departmentService } from '../services/department.service';
import { createDepartmentSchema, updateDepartmentSchema } from '../validators/department.validator';
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

export class DepartmentController {
  async getAll(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await departmentService.getAllDepartments(companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getById(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await departmentService.getDepartmentById(params.id, companyId);
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
      const data = createDepartmentSchema.parse(body);
      const result = await departmentService.createDepartment(companyId, data, userId);
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
      const data = updateDepartmentSchema.parse(body);
      const result = await departmentService.updateDepartment(params.id, companyId, data, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async delete(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const result = await departmentService.deleteDepartment(params.id, companyId, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const departmentController = new DepartmentController();
