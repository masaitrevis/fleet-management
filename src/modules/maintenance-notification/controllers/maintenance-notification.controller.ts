import { NextRequest, NextResponse } from 'next/server';
import { maintenanceNotificationService } from '../services/maintenance-notification.service';
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

export class MaintenanceNotificationController {
  async getAll(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const result = await maintenanceNotificationService.getAll(companyId, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async markRead(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await maintenanceNotificationService.markRead(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getUnreadCount(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await maintenanceNotificationService.getUnreadCount(companyId);
      return successResponse({ count: result });
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const maintenanceNotificationController = new MaintenanceNotificationController();
