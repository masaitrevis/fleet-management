import { NextRequest, NextResponse } from 'next/server';
import { notificationPreferenceService } from '../services/notification-preference.service';
import { createPreferenceSchema, updatePreferenceSchema, preferenceSearchSchema } from '../validators/notification-preference.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class NotificationPreferenceController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = preferenceSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const userId = req.headers.get('x-user-id')!; const result = await notificationPreferenceService.getAll(companyId, userId, { ...search, page: Number(search.page || 1), limit: Number(search.limit || 20) }); return successResponse(result); }
    catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) { try { const userId = req.headers.get('x-user-id')!; return successResponse(await notificationPreferenceService.getById(id, companyId, userId)); } catch (error) { return errorResponse(error as Error); } }
  async create(req: NextRequest, companyId: string) { try { const data = createPreferenceSchema.parse(await req.json()); const userId = req.headers.get('x-user-id')!; return successResponse(await notificationPreferenceService.create(companyId, userId, data), 201); } catch (error) { return errorResponse(error as Error); } }
  async update(req: NextRequest, companyId: string, id: string) { try { const data = updatePreferenceSchema.parse(await req.json()); const userId = req.headers.get('x-user-id')!; return successResponse(await notificationPreferenceService.update(id, companyId, userId, data)); } catch (error) { return errorResponse(error as Error); } }
  async delete(req: NextRequest, companyId: string, id: string) { try { const userId = req.headers.get('x-user-id')!; await notificationPreferenceService.delete(id, companyId, userId); return successResponse({ message: 'Deleted' }); } catch (error) { return errorResponse(error as Error); } }
  async upsert(req: NextRequest, companyId: string) { try { const data = createPreferenceSchema.parse(await req.json()); const userId = req.headers.get('x-user-id')!; return successResponse(await notificationPreferenceService.upsert(companyId, userId, data)); } catch (error) { return errorResponse(error as Error); } }
}

export const notificationPreferenceController = new NotificationPreferenceController();
