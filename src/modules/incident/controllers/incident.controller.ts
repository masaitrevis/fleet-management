import { NextRequest, NextResponse } from 'next/server';
import { incidentService } from '../services/incident.service';
import { createIncidentSchema, updateIncidentSchema, incidentSearchSchema } from '../validators/incident.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class IncidentController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = incidentSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await incidentService.getAll(companyId, { ...search, page: Number(search.page || 1), limit: Number(search.limit || 20) }); return successResponse(result); }
    catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) {
    try { return successResponse(await incidentService.getById(id, companyId)); } catch (error) { return errorResponse(error as Error); }
  }
  async create(req: NextRequest, companyId: string) {
    try { const data = createIncidentSchema.parse(await req.json()); return successResponse(await incidentService.create(companyId, data), 201); } catch (error) { return errorResponse(error as Error); }
  }
  async update(req: NextRequest, companyId: string, id: string) {
    try { const data = updateIncidentSchema.parse(await req.json()); return successResponse(await incidentService.update(id, companyId, data)); } catch (error) { return errorResponse(error as Error); }
  }
  async delete(req: NextRequest, companyId: string, id: string) {
    try { await incidentService.delete(id, companyId); return successResponse({ message: 'Deleted' }); } catch (error) { return errorResponse(error as Error); }
  }
}

export const incidentController = new IncidentController();
