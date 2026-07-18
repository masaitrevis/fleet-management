import { NextRequest, NextResponse } from 'next/server';
import { correctiveActionService } from '../services/corrective-action.service';
import { createCorrectiveActionSchema, updateCorrectiveActionSchema, correctiveActionSearchSchema } from '../validators/corrective-action.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class CorrectiveActionController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = correctiveActionSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await correctiveActionService.getAll(companyId, { ...search, page: Number(search.page || 1), limit: Number(search.limit || 20) }); return successResponse(result); }
    catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) { try { return successResponse(await correctiveActionService.getById(id, companyId)); } catch (error) { return errorResponse(error as Error); } }
  async create(req: NextRequest, companyId: string) { try { const data = createCorrectiveActionSchema.parse(await req.json()); return successResponse(await correctiveActionService.create(companyId, data), 201); } catch (error) { return errorResponse(error as Error); } }
  async update(req: NextRequest, companyId: string, id: string) { try { const data = updateCorrectiveActionSchema.parse(await req.json()); return successResponse(await correctiveActionService.update(id, companyId, data)); } catch (error) { return errorResponse(error as Error); } }
  async delete(req: NextRequest, companyId: string, id: string) { try { await correctiveActionService.delete(id, companyId); return successResponse({ message: 'Deleted' }); } catch (error) { return errorResponse(error as Error); } }
}

export const correctiveActionController = new CorrectiveActionController();
