import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '../services/notification.service';
import { createNotificationSchema, notificationSearchSchema, markReadSchema } from '../validators/notification.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class NotificationController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = notificationSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await notificationService.getAll(companyId, { ...search, page: Number(search.page || 1), limit: Number(search.limit || 20) }); return successResponse(result); }
    catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) { try { return successResponse(await notificationService.getById(id, companyId)); } catch (error) { return errorResponse(error as Error); } }
  async create(req: NextRequest, companyId: string) { try { const data = createNotificationSchema.parse(await req.json()); return successResponse(await notificationService.create(companyId, data), 201); } catch (error) { return errorResponse(error as Error); } }
  async update(req: NextRequest, companyId: string, id: string) { try { const data = await req.json(); return successResponse(await notificationService.update(id, companyId, data)); } catch (error) { return errorResponse(error as Error); } }
  async markRead(req: NextRequest, companyId: string, id: string) { try { return successResponse(await notificationService.markRead(id, companyId)); } catch (error) { return errorResponse(error as Error); } }
  async markReadAll(req: NextRequest, companyId: string) { try { const userId = req.headers.get('x-user-id')!; return successResponse(await notificationService.markReadAll(companyId, userId)); } catch (error) { return errorResponse(error as Error); } }
  async archive(req: NextRequest, companyId: string, id: string) { try { return successResponse(await notificationService.archive(id, companyId)); } catch (error) { return errorResponse(error as Error); } }
  async delete(req: NextRequest, companyId: string, id: string) { try { await notificationService.delete(id, companyId); return successResponse({ message: 'Deleted' }); } catch (error) { return errorResponse(error as Error); } }
  async getUnreadCount(req: NextRequest, companyId: string) { try { const userId = req.headers.get('x-user-id')!; return successResponse({ count: await notificationService.getUnreadCount(companyId, userId) }); } catch (error) { return errorResponse(error as Error); } }
  async getStats(req: NextRequest, companyId: string) { try { return successResponse(await notificationService.getStats(companyId)); } catch (error) { return errorResponse(error as Error); } }
}

export const notificationController = new NotificationController();
