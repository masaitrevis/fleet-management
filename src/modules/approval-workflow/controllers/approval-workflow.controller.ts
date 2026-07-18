import { NextRequest, NextResponse } from 'next/server';
import { approvalWorkflowService, approvalRequestService } from '../services/approval-workflow.service';
import { createApprovalWorkflowSchema, updateApprovalWorkflowSchema, approvalWorkflowSearchSchema, createApprovalRequestSchema, updateApprovalRequestSchema } from '../validators/approval-workflow.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class ApprovalWorkflowController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = approvalWorkflowSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await approvalWorkflowService.getAll(companyId, { ...search, page: Number(search.page || 1), limit: Number(search.limit || 20) }); return successResponse(result); } catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) { try { return successResponse(await approvalWorkflowService.getById(id, companyId)); } catch (error) { return errorResponse(error as Error); } }
  async create(req: NextRequest, companyId: string) { try { const data = createApprovalWorkflowSchema.parse(await req.json()); return successResponse(await approvalWorkflowService.create(companyId, data), 201); } catch (error) { return errorResponse(error as Error); } }
  async update(req: NextRequest, companyId: string, id: string) { try { const data = updateApprovalWorkflowSchema.parse(await req.json()); return successResponse(await approvalWorkflowService.update(id, companyId, data)); } catch (error) { return errorResponse(error as Error); } }
  async delete(req: NextRequest, companyId: string, id: string) { try { await approvalWorkflowService.delete(id, companyId); return successResponse({ message: 'Deleted' }); } catch (error) { return errorResponse(error as Error); } }
}

export class ApprovalRequestController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = approvalWorkflowSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await approvalRequestService.getAll(companyId, { ...search, page: Number(search.page || 1), limit: Number(search.limit || 20) }); return successResponse(result); } catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) { try { return successResponse(await approvalRequestService.getById(id, companyId)); } catch (error) { return errorResponse(error as Error); } }
  async create(req: NextRequest, companyId: string) {
    try { const data = createApprovalRequestSchema.parse(await req.json()); const userId = req.headers.get('x-user-id')!; return successResponse(await approvalRequestService.create(companyId, data, userId), 201); } catch (error) { return errorResponse(error as Error); }
  }
  async update(req: NextRequest, companyId: string, id: string) {
    try { const data = updateApprovalRequestSchema.parse(await req.json()); const userId = req.headers.get('x-user-id')!; return successResponse(await approvalRequestService.update(id, companyId, data, userId)); } catch (error) { return errorResponse(error as Error); }
  }
}

export const approvalWorkflowController = new ApprovalWorkflowController();
export const approvalRequestController = new ApprovalRequestController();
