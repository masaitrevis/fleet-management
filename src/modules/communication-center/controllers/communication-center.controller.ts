import { NextRequest, NextResponse } from 'next/server';
import { communicationCenterService } from '../services/communication-center.service';
import { createThreadSchema, createMessageSchema, threadSearchSchema } from '../validators/communication-center.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class CommunicationCenterController {
  async getThreads(req: NextRequest, companyId: string) {
    try { const search = threadSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await communicationCenterService.getThreads(companyId, { ...search, page: Number(search.page || 1), limit: Number(search.limit || 20) }); return successResponse(result); } catch (error) { return errorResponse(error as Error); }
  }
  async getThreadById(req: NextRequest, companyId: string, id: string) { try { return successResponse(await communicationCenterService.getThreadById(id, companyId)); } catch (error) { return errorResponse(error as Error); } }
  async createThread(req: NextRequest, companyId: string) { try { const data = createThreadSchema.parse(await req.json()); return successResponse(await communicationCenterService.createThread(companyId, data), 201); } catch (error) { return errorResponse(error as Error); } }
  async createMessage(req: NextRequest, companyId: string) { try { const data = createMessageSchema.parse(await req.json()); const senderId = req.headers.get('x-user-id')!; return successResponse(await communicationCenterService.createMessage(companyId, data, senderId), 201); } catch (error) { return errorResponse(error as Error); } }
  async markThreadRead(req: NextRequest, companyId: string, id: string) { try { return successResponse(await communicationCenterService.markThreadRead(id, companyId)); } catch (error) { return errorResponse(error as Error); } }
  async archiveThread(req: NextRequest, companyId: string, id: string) { try { return successResponse(await communicationCenterService.archiveThread(id, companyId)); } catch (error) { return errorResponse(error as Error); } }
  async deleteThread(req: NextRequest, companyId: string, id: string) { try { await communicationCenterService.deleteThread(id, companyId); return successResponse({ message: 'Deleted' }); } catch (error) { return errorResponse(error as Error); } }
}

export const communicationCenterController = new CommunicationCenterController();
