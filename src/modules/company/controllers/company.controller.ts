import { NextRequest, NextResponse } from 'next/server';
import { companyService } from '../services/company.service';
import { updateCompanySchema, companySettingsSchema } from '../validators/company.validator';
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

export class CompanyController {
  async getCompany(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await companyService.getCompany(companyId, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async updateCompany(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const body = await req.json();
      const data = updateCompanySchema.parse(body);
      const result = await companyService.updateCompany(companyId, companyId, data);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getSettings(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await companyService.getSettings(companyId, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async updateSettings(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const body = await req.json();
      const data = companySettingsSchema.parse(body);
      const result = await companyService.updateSettings(companyId, companyId, data);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const companyController = new CompanyController();
