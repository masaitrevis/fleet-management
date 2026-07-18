import { NextRequest, NextResponse } from 'next/server';
import { deliveryQueueService } from '../services/delivery-queue.service';
import { createQueueItemSchema, queueSearchSchema } from '../validators/delivery-queue.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class DeliveryQueueController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = queueSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await deliveryQueueService.getAll(companyId, { ...search, page: Number(search.page || 1), limit: Number(search.limit || 20) }); return successResponse(result); } catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) { try { return successResponse(await deliveryQueueService.getById(id, companyId)); } catch (error) { return errorResponse(error as Error); } }
  async create(req: NextRequest, companyId: string) { try { const data = createQueueItemSchema.parse(await req.json()); return successResponse(await deliveryQueueService.create(companyId, data), 201); } catch (error) { return errorResponse(error as Error); } }
  async update(req: NextRequest, companyId: string, id: string) { try { const data = await req.json(); return successResponse(await deliveryQueueService.update(id, companyId, data)); } catch (error) { return errorResponse(error as Error); } }
  async delete(req: NextRequest, companyId: string, id: string) { try { await deliveryQueueService.delete(id, companyId); return successResponse({ message: 'Queue item deleted' }); } catch (error) { return errorResponse(error as Error); } }
  async getPending(req: NextRequest, companyId: string) { try { return successResponse(await deliveryQueueService.getPending(companyId)); } catch (error) { return errorResponse(error as Error); } }
}

export const deliveryQueueController = new DeliveryQueueController();
