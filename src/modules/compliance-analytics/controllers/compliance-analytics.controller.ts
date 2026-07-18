import { NextRequest, NextResponse } from 'next/server';
import { complianceAnalyticsService } from '../services/compliance-analytics.service';
import { complianceAnalyticsSearchSchema } from '../validators/compliance-analytics.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class ComplianceAnalyticsController {
  async overview(req: NextRequest, companyId: string) {
    try { return successResponse(await complianceAnalyticsService.overview(companyId)); } catch (error) { return errorResponse(error as Error); }
  }
  async score(req: NextRequest, companyId: string) {
    try { return successResponse({ score: await complianceAnalyticsService.complianceScore(companyId) }); } catch (error) { return errorResponse(error as Error); }
  }
  async trends(req: NextRequest, companyId: string) {
    try { const search = complianceAnalyticsSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); return successResponse(await complianceAnalyticsService.incidentTrends(companyId, Number(search.days || 30))); } catch (error) { return errorResponse(error as Error); }
  }
}

export const complianceAnalyticsController = new ComplianceAnalyticsController();
