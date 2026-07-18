const fs = require('fs');
const path = require('path');

const BASE = '/root/.openclaw/workspace/fleet-management-saas/src/modules';

function mkdir(p) { fs.mkdirSync(p, { recursive: true }); }
function write(f, c) { mkdir(path.dirname(f)); fs.writeFileSync(f, c); }

// ========== NOTIFICATION ==========
write(`${BASE}/notification/validators/notification.validator.ts`, `import { z } from 'zod';
import { NotificationChannel, NotificationType, NotificationPriority, NotificationStatus } from '@prisma/client';

export const createNotificationSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  type: z.nativeEnum(NotificationType).default('CUSTOM'),
  category: z.string().max(100).optional().nullable(),
  channel: z.nativeEnum(NotificationChannel).default('IN_APP'),
  priority: z.nativeEnum(NotificationPriority).default('NORMAL'),
  actionUrl: z.string().url().optional().nullable(),
  actionLabel: z.string().max(100).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  metadata: z.string().optional().nullable(),
  relatedEntityType: z.string().max(100).optional().nullable(),
  relatedEntityId: z.string().uuid().optional().nullable(),
  scheduledFor: z.string().datetime().optional().nullable(),
});

export const notificationSearchSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  channel: z.string().optional(),
  userId: z.string().optional(),
  unread: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();

export const markReadSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  all: z.boolean().optional(),
});
`);

write(`${BASE}/notification/repositories/notification.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class NotificationRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.NotificationWhereInput = { companyId, deletedAt: null };
    if (search.q) where.title = { contains: search.q, mode: 'insensitive' };
    if (search.type) where.type = search.type;
    if (search.status) where.status = search.status;
    if (search.priority) where.priority = search.priority;
    if (search.channel) where.channel = search.channel;
    if (search.userId) where.userId = search.userId;
    if (search.unread === 'true') where.status = { not: 'READ' };

    const pageNum = Number(search.page) || 1;
    const limitNum = Number(search.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where, skip: (pageNum - 1) * limitNum, take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { deliveryLogs: true },
      }),
      prisma.notification.count({ where }),
    ]);
    return { notifications: data, total };
  }

  async findById(id: string, companyId: string) {
    const n = await prisma.notification.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { deliveryLogs: true },
    });
    if (!n) throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    return n;
  }

  async create(companyId: string, data: any) {
    return prisma.notification.create({
      data: { ...data, companyId, status: 'PENDING' },
      include: { deliveryLogs: true },
    });
  }

  async markRead(id: string, companyId: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async markReadAll(companyId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { companyId, userId, status: { not: 'READ' }, deletedAt: null },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async archive(id: string, companyId: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.notification.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getUnreadCount(companyId: string, userId: string) {
    return prisma.notification.count({
      where: { companyId, userId, status: { notIn: ['READ', 'ARCHIVED'] }, deletedAt: null },
    });
  }

  async getStats(companyId: string) {
    const [total, unread, pending, failed, today] = await Promise.all([
      prisma.notification.count({ where: { companyId, deletedAt: null } }),
      prisma.notification.count({ where: { companyId, status: { notIn: ['READ', 'ARCHIVED'] }, deletedAt: null } }),
      prisma.notification.count({ where: { companyId, status: 'PENDING', deletedAt: null } }),
      prisma.notification.count({ where: { companyId, status: 'FAILED', deletedAt: null } }),
      prisma.notification.count({ where: { companyId, deletedAt: null, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    ]);
    return { total, unread, pending, failed, today };
  }
}

export const notificationRepository = new NotificationRepository();
`);

write(`${BASE}/notification/services/notification.service.ts`, `import { notificationRepository } from '../repositories/notification.repository';

export class NotificationService {
  async getAll(companyId: string, search: any) { return notificationRepository.findAll(companyId, search); }
  async getById(id: string, companyId: string) { return notificationRepository.findById(id, companyId); }
  async create(companyId: string, data: any) { return notificationRepository.create(companyId, data); }
  async markRead(id: string, companyId: string) { return notificationRepository.markRead(id, companyId); }
  async markReadAll(companyId: string, userId: string) { return notificationRepository.markReadAll(companyId, userId); }
  async archive(id: string, companyId: string) { return notificationRepository.archive(id, companyId); }
  async delete(id: string, companyId: string) { return notificationRepository.delete(id, companyId); }
  async getUnreadCount(companyId: string, userId: string) { return notificationRepository.getUnreadCount(companyId, userId); }
  async getStats(companyId: string) { return notificationRepository.getStats(companyId); }
}

export const notificationService = new NotificationService();
`);

write(`${BASE}/notification/controllers/notification.controller.ts`, `import { NextRequest, NextResponse } from 'next/server';
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
  async markRead(req: NextRequest, companyId: string, id: string) { try { return successResponse(await notificationService.markRead(id, companyId)); } catch (error) { return errorResponse(error as Error); } }
  async markReadAll(req: NextRequest, companyId: string) { try { const userId = req.headers.get('x-user-id')!; return successResponse(await notificationService.markReadAll(companyId, userId)); } catch (error) { return errorResponse(error as Error); } }
  async archive(req: NextRequest, companyId: string, id: string) { try { return successResponse(await notificationService.archive(id, companyId)); } catch (error) { return errorResponse(error as Error); } }
  async delete(req: NextRequest, companyId: string, id: string) { try { await notificationService.delete(id, companyId); return successResponse({ message: 'Deleted' }); } catch (error) { return errorResponse(error as Error); } }
  async getUnreadCount(req: NextRequest, companyId: string) { try { const userId = req.headers.get('x-user-id')!; return successResponse({ count: await notificationService.getUnreadCount(companyId, userId) }); } catch (error) { return errorResponse(error as Error); } }
  async getStats(req: NextRequest, companyId: string) { try { return successResponse(await notificationService.getStats(companyId)); } catch (error) { return errorResponse(error as Error); } }
}

export const notificationController = new NotificationController();
`);

// ========== NOTIFICATION PREFERENCE ==========
write(`${BASE}/notification-preference/validators/notification-preference.validator.ts`, `import { z } from 'zod';
import { NotificationType, NotificationChannel, DigestFrequency } from '@prisma/client';

export const createPreferenceSchema = z.object({
  notificationType: z.nativeEnum(NotificationType),
  channels: z.array(z.nativeEnum(NotificationChannel)).default(['IN_APP']),
  enabled: z.boolean().default(true),
  quietHoursStart: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/).optional().nullable(),
  quietHoursEnd: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/).optional().nullable(),
  digestFrequency: z.nativeEnum(DigestFrequency).default('IMMEDIATE'),
  language: z.string().max(10).default('en'),
  timezone: z.string().max(50).default('UTC'),
});

export const updatePreferenceSchema = createPreferenceSchema.partial();

export const preferenceSearchSchema = z.object({
  notificationType: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();
`);

write(`${BASE}/notification-preference/repositories/notification-preference.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class NotificationPreferenceRepository {
  async findAll(companyId: string, userId: string, search: any) {
    const where: Prisma.NotificationPreferenceWhereInput = { companyId, userId };
    if (search.notificationType) where.notificationType = search.notificationType;

    const pageNum = Number(search.page) || 1;
    const limitNum = Number(search.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.notificationPreference.findMany({
        where, skip: (pageNum - 1) * limitNum, take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notificationPreference.count({ where }),
    ]);
    return { preferences: data, total };
  }

  async findById(id: string, companyId: string, userId: string) {
    const p = await prisma.notificationPreference.findFirst({ where: { id, companyId, userId } });
    if (!p) throw new AppError('Preference not found', 404, 'PREFERENCE_NOT_FOUND');
    return p;
  }

  async create(companyId: string, userId: string, data: any) {
    return prisma.notificationPreference.create({
      data: { ...data, companyId, userId },
    });
  }

  async update(id: string, companyId: string, userId: string, data: any) {
    await this.findById(id, companyId, userId);
    return prisma.notificationPreference.update({ where: { id }, data });
  }

  async delete(id: string, companyId: string, userId: string) {
    await this.findById(id, companyId, userId);
    return prisma.notificationPreference.delete({ where: { id } });
  }

  async upsert(companyId: string, userId: string, data: any) {
    return prisma.notificationPreference.upsert({
      where: {
        companyId_userId_notificationType: {
          companyId, userId, notificationType: data.notificationType,
        },
      },
      create: { ...data, companyId, userId },
      update: data,
    });
  }
}

export const notificationPreferenceRepository = new NotificationPreferenceRepository();
`);

write(`${BASE}/notification-preference/services/notification-preference.service.ts`, `import { notificationPreferenceRepository } from '../repositories/notification-preference.repository';

export class NotificationPreferenceService {
  async getAll(companyId: string, userId: string, search: any) { return notificationPreferenceRepository.findAll(companyId, userId, search); }
  async getById(id: string, companyId: string, userId: string) { return notificationPreferenceRepository.findById(id, companyId, userId); }
  async create(companyId: string, userId: string, data: any) { return notificationPreferenceRepository.create(companyId, userId, data); }
  async update(id: string, companyId: string, userId: string, data: any) { return notificationPreferenceRepository.update(id, companyId, userId, data); }
  async delete(id: string, companyId: string, userId: string) { return notificationPreferenceRepository.delete(id, companyId, userId); }
  async upsert(companyId: string, userId: string, data: any) { return notificationPreferenceRepository.upsert(companyId, userId, data); }
}

export const notificationPreferenceService = new NotificationPreferenceService();
`);

write(`${BASE}/notification-preference/controllers/notification-preference.controller.ts`, `import { NextRequest, NextResponse } from 'next/server';
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
`);

// ========== NOTIFICATION TEMPLATE ==========
write(`${BASE}/notification-template/validators/notification-template.validator.ts`, `import { z } from 'zod';
import { TemplateType, NotificationType } from '@prisma/client';

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional().nullable(),
  templateType: z.nativeEnum(TemplateType),
  subject: z.string().max(200).optional().nullable(),
  body: z.string().min(1),
  variables: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  category: z.string().max(100).optional().nullable(),
  notificationType: z.nativeEnum(NotificationType).optional().nullable(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const templateSearchSchema = z.object({
  q: z.string().optional(),
  templateType: z.string().optional(),
  isActive: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();
`);

write(`${BASE}/notification-template/repositories/notification-template.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class NotificationTemplateRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.NotificationTemplateWhereInput = { companyId, deletedAt: null };
    if (search.q) where.name = { contains: search.q, mode: 'insensitive' };
    if (search.templateType) where.templateType = search.templateType;
    if (search.isActive !== undefined) where.isActive = search.isActive === 'true';

    const pageNum = Number(search.page) || 1;
    const limitNum = Number(search.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.notificationTemplate.findMany({
        where, skip: (pageNum - 1) * limitNum, take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notificationTemplate.count({ where }),
    ]);
    return { templates: data, total };
  }

  async findById(id: string, companyId: string) {
    const t = await prisma.notificationTemplate.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!t) throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    return t;
  }

  async create(companyId: string, data: any) {
    return prisma.notificationTemplate.create({ data: { ...data, companyId } });
  }

  async update(id: string, companyId: string, data: any) {
    await this.findById(id, companyId);
    return prisma.notificationTemplate.update({ where: { id }, data });
  }

  async delete(id: string, companyId: string) {
    await this.findById(id, companyId);
    return prisma.notificationTemplate.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const notificationTemplateRepository = new NotificationTemplateRepository();
`);

write(`${BASE}/notification-template/services/notification-template.service.ts`, `import { notificationTemplateRepository } from '../repositories/notification-template.repository';

export class NotificationTemplateService {
  async getAll(companyId: string, search: any) { return notificationTemplateRepository.findAll(companyId, search); }
  async getById(id: string, companyId: string) { return notificationTemplateRepository.findById(id, companyId); }
  async create(companyId: string, data: any) { return notificationTemplateRepository.create(companyId, data); }
  async update(id: string, companyId: string, data: any) { return notificationTemplateRepository.update(id, companyId, data); }
  async delete(id: string, companyId: string) { return notificationTemplateRepository.delete(id, companyId); }
}

export const notificationTemplateService = new NotificationTemplateService();
`);

write(`${BASE}/notification-template/controllers/notification-template.controller.ts`, `import { NextRequest, NextResponse } from 'next/server';
import { notificationTemplateService } from '../services/notification-template.service';
import { createTemplateSchema, updateTemplateSchema, templateSearchSchema } from '../validators/notification-template.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class NotificationTemplateController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = templateSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await notificationTemplateService.getAll(companyId, { ...search, page: Number(search.page || 1), limit: Number(search.limit || 20) }); return successResponse(result); } catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) { try { return successResponse(await notificationTemplateService.getById(id, companyId)); } catch (error) { return errorResponse(error as Error); } }
  async create(req: NextRequest, companyId: string) { try { const data = createTemplateSchema.parse(await req.json()); return successResponse(await notificationTemplateService.create(companyId, data), 201); } catch (error) { return errorResponse(error as Error); } }
  async update(req: NextRequest, companyId: string, id: string) { try { const data = updateTemplateSchema.parse(await req.json()); return successResponse(await notificationTemplateService.update(id, companyId, data)); } catch (error) { return errorResponse(error as Error); } }
  async delete(req: NextRequest, companyId: string, id: string) { try { await notificationTemplateService.delete(id, companyId); return successResponse({ message: 'Deleted' }); } catch (error) { return errorResponse(error as Error); } }
}

export const notificationTemplateController = new NotificationTemplateController();
`);

// ========== DELIVERY QUEUE ==========
write(`${BASE}/delivery-queue/validators/delivery-queue.validator.ts`, `import { z } from 'zod';
import { NotificationChannel, NotificationPriority } from '@prisma/client';

export const createQueueItemSchema = z.object({
  notificationId: z.string().uuid(),
  channel: z.nativeEnum(NotificationChannel),
  priority: z.nativeEnum(NotificationPriority).default('NORMAL'),
  scheduledFor: z.string().datetime().optional().nullable(),
});

export const queueSearchSchema = z.object({
  status: z.string().optional(),
  channel: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();
`);

write(`${BASE}/delivery-queue/repositories/delivery-queue.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class DeliveryQueueRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.DeliveryQueueWhereInput = { companyId };
    if (search.status) where.status = search.status;
    if (search.channel) where.channel = search.channel;

    const pageNum = Number(search.page) || 1;
    const limitNum = Number(search.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.deliveryQueue.findMany({
        where, skip: (pageNum - 1) * limitNum, take: limitNum,
        orderBy: { priority: 'desc', createdAt: 'asc' },
      }),
      prisma.deliveryQueue.count({ where }),
    ]);
    return { queue: data, total };
  }

  async findById(id: string, companyId: string) {
    const q = await prisma.deliveryQueue.findFirst({ where: { id, companyId } });
    if (!q) throw new AppError('Queue item not found', 404, 'QUEUE_ITEM_NOT_FOUND');
    return q;
  }

  async create(companyId: string, data: any) {
    return prisma.deliveryQueue.create({ data: { ...data, companyId } });
  }

  async updateStatus(id: string, companyId: string, status: string, errorMessage?: string) {
    await this.findById(id, companyId);
    const updateData: any = { status };
    if (status === 'SENT') updateData.processedAt = new Date();
    if (status === 'FAILED') { updateData.failedAt = new Date(); updateData.errorMessage = errorMessage; }
    return prisma.deliveryQueue.update({ where: { id }, data: updateData });
  }

  async getPending(companyId: string, limit = 50) {
    return prisma.deliveryQueue.findMany({
      where: { companyId, status: 'QUEUED', scheduledFor: { lte: new Date() } },
      orderBy: { priority: 'desc', createdAt: 'asc' },
      take: limit,
    });
  }
}

export const deliveryQueueRepository = new DeliveryQueueRepository();
`);

write(`${BASE}/delivery-queue/services/delivery-queue.service.ts`, `import { deliveryQueueRepository } from '../repositories/delivery-queue.repository';

export class DeliveryQueueService {
  async getAll(companyId: string, search: any) { return deliveryQueueRepository.findAll(companyId, search); }
  async getById(id: string, companyId: string) { return deliveryQueueRepository.findById(id, companyId); }
  async create(companyId: string, data: any) { return deliveryQueueRepository.create(companyId, data); }
  async updateStatus(id: string, companyId: string, status: string, errorMessage?: string) { return deliveryQueueRepository.updateStatus(id, companyId, status, errorMessage); }
  async getPending(companyId: string, limit?: number) { return deliveryQueueRepository.getPending(companyId, limit); }
}

export const deliveryQueueService = new DeliveryQueueService();
`);

write(`${BASE}/delivery-queue/controllers/delivery-queue.controller.ts`, `import { NextRequest, NextResponse } from 'next/server';
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
  async getPending(req: NextRequest, companyId: string) { try { return successResponse(await deliveryQueueService.getPending(companyId)); } catch (error) { return errorResponse(error as Error); } }
}

export const deliveryQueueController = new DeliveryQueueController();
`);

// ========== COMMUNICATION CENTER ==========
write(`${BASE}/communication-center/validators/communication-center.validator.ts`, `import { z } from 'zod';

export const createThreadSchema = z.object({
  subject: z.string().min(1).max(200),
  participants: z.array(z.string().uuid()),
});

export const createMessageSchema = z.object({
  threadId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  attachments: z.array(z.string().url()).optional().default([]),
});

export const threadSearchSchema = z.object({
  q: z.string().optional(),
  isArchived: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();
`);

write(`${BASE}/communication-center/repositories/communication-center.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class CommunicationCenterRepository {
  async findThreads(companyId: string, search: any) {
    const where: Prisma.CommunicationThreadWhereInput = { companyId, deletedAt: null };
    if (search.q) where.subject = { contains: search.q, mode: 'insensitive' };
    if (search.isArchived !== undefined) where.isArchived = search.isArchived === 'true';

    const pageNum = Number(search.page) || 1;
    const limitNum = Number(search.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.communicationThread.findMany({
        where, skip: (pageNum - 1) * limitNum, take: limitNum,
        orderBy: { lastMessageAt: 'desc' },
        include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
      }),
      prisma.communicationThread.count({ where }),
    ]);
    return { threads: data, total };
  }

  async findThreadById(id: string, companyId: string) {
    const t = await prisma.communicationThread.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!t) throw new AppError('Thread not found', 404, 'THREAD_NOT_FOUND');
    return t;
  }

  async createThread(companyId: string, data: any) {
    return prisma.communicationThread.create({
      data: { ...data, companyId },
      include: { messages: true },
    });
  }

  async createMessage(companyId: string, data: any, senderId: string) {
    const thread = await prisma.communicationThread.findFirst({ where: { id: data.threadId, companyId } });
    if (!thread) throw new AppError('Thread not found', 404, 'THREAD_NOT_FOUND');
    return prisma.communicationMessage.create({
      data: { ...data, senderId },
    });
  }

  async markThreadRead(id: string, companyId: string) {
    await this.findThreadById(id, companyId);
    return prisma.communicationMessage.updateMany({
      where: { threadId: id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async archiveThread(id: string, companyId: string) {
    await this.findThreadById(id, companyId);
    return prisma.communicationThread.update({ where: { id }, data: { isArchived: true } });
  }

  async deleteThread(id: string, companyId: string) {
    await this.findThreadById(id, companyId);
    return prisma.communicationThread.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const communicationCenterRepository = new CommunicationCenterRepository();
`);

write(`${BASE}/communication-center/services/communication-center.service.ts`, `import { communicationCenterRepository } from '../repositories/communication-center.repository';

export class CommunicationCenterService {
  async getThreads(companyId: string, search: any) { return communicationCenterRepository.findThreads(companyId, search); }
  async getThreadById(id: string, companyId: string) { return communicationCenterRepository.findThreadById(id, companyId); }
  async createThread(companyId: string, data: any) { return communicationCenterRepository.createThread(companyId, data); }
  async createMessage(companyId: string, data: any, senderId: string) { return communicationCenterRepository.createMessage(companyId, data, senderId); }
  async markThreadRead(id: string, companyId: string) { return communicationCenterRepository.markThreadRead(id, companyId); }
  async archiveThread(id: string, companyId: string) { return communicationCenterRepository.archiveThread(id, companyId); }
  async deleteThread(id: string, companyId: string) { return communicationCenterRepository.deleteThread(id, companyId); }
}

export const communicationCenterService = new CommunicationCenterService();
`);

write(`${BASE}/communication-center/controllers/communication-center.controller.ts`, `import { NextRequest, NextResponse } from 'next/server';
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
`);

console.log('Phase 14 backend modules created');
