import { NextRequest, NextResponse } from 'next/server';
import { complianceRuleService } from '../services/compliance-rule.service';
import { createComplianceRuleSchema, updateComplianceRuleSchema, complianceRuleSearchSchema } from '../validators/compliance-rule.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) {
    return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  }
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class ComplianceRuleController {
  async getAll(req: NextRequest, companyId: string) {
    try {
      const search = complianceRuleSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
      const result = await complianceRuleService.getAll(companyId, { ...search, page: Number(search.page || 1), limit: Number(search.limit || 20) });
      return successResponse(result);
    } catch (error) { return errorResponse(error as Error); }
  }

  async getById(req: NextRequest, companyId: string, id: string) {
    try { return successResponse(await complianceRuleService.getById(id, companyId)); }
    catch (error) { return errorResponse(error as Error); }
  }

  async create(req: NextRequest, companyId: string) {
    try { const data = createComplianceRuleSchema.parse(await req.json()); return successResponse(await complianceRuleService.create(companyId, data), 201); }
    catch (error) { return errorResponse(error as Error); }
  }

  async update(req: NextRequest, companyId: string, id: string) {
    try { const data = updateComplianceRuleSchema.parse(await req.json()); return successResponse(await complianceRuleService.update(id, companyId, data)); }
    catch (error) { return errorResponse(error as Error); }
  }

  async delete(req: NextRequest, companyId: string, id: string) {
    try { await complianceRuleService.delete(id, companyId); return successResponse({ message: 'Deleted' }); }
    catch (error) { return errorResponse(error as Error); }
  }
}

export const complianceRuleController = new ComplianceRuleController();
