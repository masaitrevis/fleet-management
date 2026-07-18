const fs = require('fs');
const path = require('path');

const BASE = '/root/.openclaw/workspace/fleet-management-saas/src/modules';

function mkdir(p) { fs.mkdirSync(p, { recursive: true }); }
function write(f, c) { mkdir(path.dirname(f)); fs.writeFileSync(f, c); }

// ============== COMPLIANCE RULE ==============
write(`${BASE}/compliance-rule/validators/compliance-rule.validator.ts`, `import { z } from 'zod';
import { ComplianceRuleType, ComplianceRuleStatus } from '@prisma/client';

export const createComplianceRuleSchema = z.object({
  ruleType: z.nativeEnum(ComplianceRuleType),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  appliesTo: z.enum(['VEHICLE', 'DRIVER', 'BOTH']),
  documentType: z.string().optional().nullable(),
  inspectionType: z.string().optional().nullable(),
  gracePeriodDays: z.number().int().min(0).default(0),
  isMandatory: z.boolean().default(true),
  isBlocking: z.boolean().default(true),
  autoRenewal: z.boolean().default(false),
  reminderDays: z.array(z.number().int()).default([30, 7, 1]),
  status: z.nativeEnum(ComplianceRuleStatus).default('ACTIVE'),
  priority: z.number().int().min(1).max(10).default(1),
  customLogic: z.string().optional().nullable(),
  failureAction: z.enum(['BLOCK', 'WARN', 'NOTIFY']).optional().nullable(),
});

export const updateComplianceRuleSchema = createComplianceRuleSchema.partial();

export const complianceRuleSearchSchema = z.object({
  q: z.string().optional(),
  ruleType: z.string().optional(),
  status: z.string().optional(),
  appliesTo: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();
`);

write(`${BASE}/compliance-rule/repositories/compliance-rule.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class ComplianceRuleRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.ComplianceRuleWhereInput = { companyId, deletedAt: null };
    if (search.q) where.name = { contains: search.q, mode: 'insensitive' };
    if (search.ruleType) where.ruleType = search.ruleType;
    if (search.status) where.status = search.status;
    if (search.appliesTo) where.appliesTo = search.appliesTo;

    const [data, total] = await Promise.all([
      prisma.complianceRule.findMany({
        where, skip: (search.page - 1) * search.limit, take: search.limit,
        orderBy: { priority: 'desc', createdAt: 'desc' },
      }),
      prisma.complianceRule.count({ where }),
    ]);
    return { rules: data, total };
  }

  async findById(id: string, companyId: string) {
    const rule = await prisma.complianceRule.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!rule) throw new AppError('COMPLIANCE_RULE_NOT_FOUND', 'Compliance rule not found', 404);
    return rule;
  }

  async create(companyId: string, data: any) {
    return prisma.complianceRule.create({ data: { ...data, companyId } });
  }

  async update(id: string, companyId: string, data: any) {
    await this.findById(id, companyId);
    return prisma.complianceRule.update({ where: { id }, data });
  }

  async delete(id: string, companyId: string) {
    await this.findById(id, companyId);
    return prisma.complianceRule.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const complianceRuleRepository = new ComplianceRuleRepository();
`);

write(`${BASE}/compliance-rule/services/compliance-rule.service.ts`, `import { complianceRuleRepository } from '../repositories/compliance-rule.repository';

export class ComplianceRuleService {
  async getAll(companyId: string, search: any) {
    return complianceRuleRepository.findAll(companyId, search);
  }

  async getById(id: string, companyId: string) {
    return complianceRuleRepository.findById(id, companyId);
  }

  async create(companyId: string, data: any) {
    return complianceRuleRepository.create(companyId, data);
  }

  async update(id: string, companyId: string, data: any) {
    return complianceRuleRepository.update(id, companyId, data);
  }

  async delete(id: string, companyId: string) {
    return complianceRuleRepository.delete(id, companyId);
  }
}

export const complianceRuleService = new ComplianceRuleService();
`);

write(`${BASE}/compliance-rule/controllers/compliance-rule.controller.ts`, `import { NextRequest } from 'next/server';
import { complianceRuleService } from '../services/compliance-rule.service';
import { createComplianceRuleSchema, updateComplianceRuleSchema, complianceRuleSearchSchema } from '../validators/compliance-rule.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) {
  return Response.json({ success: true, data }, { status });
}

function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) {
    return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  }
  return Response.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class ComplianceRuleController {
  async getAll(req: NextRequest, companyId: string) {
    try {
      const search = complianceRuleSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
      const result = await complianceRuleService.getAll(companyId, { ...search, page: Number(search.page || 1), limit: Number(search.limit || 20) });
      return successResponse(result);
    } catch (error) { return errorResponse(error as Error); }
  }

  async getById(req: NextRequest, companyId: string, id: string) {
    try { return successResponse(await complianceRuleService.getById(id, companyId)); }
    catch (error) { return errorResponse(error as Error); }
  }

  async create(req: NextRequest, companyId: string) {
    try { const data = createComplianceRuleSchema.parse(await req.json()); return successResponse(await complianceRuleService.create(companyId, data), 201); }
    catch (error) { return errorResponse(error as Error); }
  }

  async update(req: NextRequest, companyId: string, id: string) {
    try { const data = updateComplianceRuleSchema.parse(await req.json()); return successResponse(await complianceRuleService.update(id, companyId, data)); }
    catch (error) { return errorResponse(error as Error); }
  }

  async delete(req: NextRequest, companyId: string, id: string) {
    try { await complianceRuleService.delete(id, companyId); return successResponse({ message: 'Deleted' }); }
    catch (error) { return errorResponse(error as Error); }
  }
}

export const complianceRuleController = new ComplianceRuleController();
`);

// ============== INSPECTION TEMPLATE ==============
write(`${BASE}/inspection-template/validators/inspection-template.validator.ts`, `import { z } from 'zod';
import { InspectionType } from '@prisma/client';

export const inspectionTemplateItemSchema = z.object({
  itemNumber: z.number().int().min(1),
  label: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  isCritical: z.boolean().default(false),
  requiresPhoto: z.boolean().default(false),
  requiresNotes: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const createInspectionTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  inspectionType: z.nativeEnum(InspectionType),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  items: z.array(inspectionTemplateItemSchema).optional(),
});

export const updateInspectionTemplateSchema = createInspectionTemplateSchema.partial();

export const inspectionTemplateSearchSchema = z.object({
  q: z.string().optional(),
  inspectionType: z.string().optional(),
  isActive: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();
`);

write(`${BASE}/inspection-template/repositories/inspection-template.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class InspectionTemplateRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.InspectionTemplateWhereInput = { companyId, deletedAt: null };
    if (search.q) where.name = { contains: search.q, mode: 'insensitive' };
    if (search.inspectionType) where.inspectionType = search.inspectionType;
    if (search.isActive !== undefined) where.isActive = search.isActive === 'true';

    const [data, total] = await Promise.all([
      prisma.inspectionTemplate.findMany({
        where, skip: (search.page - 1) * search.limit, take: search.limit,
        include: { items: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inspectionTemplate.count({ where }),
    ]);
    return { templates: data, total };
  }

  async findById(id: string, companyId: string) {
    const template = await prisma.inspectionTemplate.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!template) throw new AppError('TEMPLATE_NOT_FOUND', 'Inspection template not found', 404);
    return template;
  }

  async create(companyId: string, data: any) {
    const { items, ...templateData } = data;
    return prisma.inspectionTemplate.create({
      data: { ...templateData, companyId, items: items ? { create: items } : undefined },
      include: { items: true },
    });
  }

  async update(id: string, companyId: string, data: any) {
    await this.findById(id, companyId);
    const { items, ...templateData } = data;
    return prisma.inspectionTemplate.update({
      where: { id },
      data: { ...templateData, items: items ? { deleteMany: {}, create: items } : undefined },
      include: { items: true },
    });
  }

  async delete(id: string, companyId: string) {
    await this.findById(id, companyId);
    return prisma.inspectionTemplate.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const inspectionTemplateRepository = new InspectionTemplateRepository();
`);

write(`${BASE}/inspection-template/services/inspection-template.service.ts`, `import { inspectionTemplateRepository } from '../repositories/inspection-template.repository';

export class InspectionTemplateService {
  async getAll(companyId: string, search: any) { return inspectionTemplateRepository.findAll(companyId, search); }
  async getById(id: string, companyId: string) { return inspectionTemplateRepository.findById(id, companyId); }
  async create(companyId: string, data: any) { return inspectionTemplateRepository.create(companyId, data); }
  async update(id: string, companyId: string, data: any) { return inspectionTemplateRepository.update(id, companyId, data); }
  async delete(id: string, companyId: string) { return inspectionTemplateRepository.delete(id, companyId); }
}

export const inspectionTemplateService = new InspectionTemplateService();
`);

write(`${BASE}/inspection-template/controllers/inspection-template.controller.ts`, `import { NextRequest } from 'next/server';
import { inspectionTemplateService } from '../services/inspection-template.service';
import { createInspectionTemplateSchema, updateInspectionTemplateSchema, inspectionTemplateSearchSchema } from '../validators/inspection-template.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return Response.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return Response.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class InspectionTemplateController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = inspectionTemplateSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await inspectionTemplateService.getAll(companyId, { ...search, page: Number(search.page || 1), limit: Number(search.limit || 20) }); return successResponse(result); }
    catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) {
    try { return successResponse(await inspectionTemplateService.getById(id, companyId)); } catch (error) { return errorResponse(error as Error); }
  }
  async create(req: NextRequest, companyId: string) {
    try { const data = createInspectionTemplateSchema.parse(await req.json()); return successResponse(await inspectionTemplateService.create(companyId, data), 201); } catch (error) { return errorResponse(error as Error); }
  }
  async update(req: NextRequest, companyId: string, id: string) {
    try { const data = updateInspectionTemplateSchema.parse(await req.json()); return successResponse(await inspectionTemplateService.update(id, companyId, data)); } catch (error) { return errorResponse(error as Error); }
  }
  async delete(req: NextRequest, companyId: string, id: string) {
    try { await inspectionTemplateService.delete(id, companyId); return successResponse({ message: 'Deleted' }); } catch (error) { return errorResponse(error as Error); }
  }
}

export const inspectionTemplateController = new InspectionTemplateController();
`);

// ============== INCIDENT ==============
write(`${BASE}/incident/validators/incident.validator.ts`, `import { z } from 'zod';
import { IncidentType, IncidentSeverity, IncidentStatus } from '@prisma/client';

export const createIncidentSchema = z.object({
  incidentType: z.nativeEnum(IncidentType),
  severity: z.nativeEnum(IncidentSeverity),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  incidentDate: z.string().datetime().or(z.date()),
  incidentTime: z.string().optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  vehicleId: z.string().uuid().optional().nullable(),
  driverId: z.string().uuid().optional().nullable(),
  tripId: z.string().uuid().optional().nullable(),
  vehicleDamage: z.string().max(2000).optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  insuranceClaim: z.boolean().default(false),
  claimNumber: z.string().max(100).optional().nullable(),
  fineAmount: z.number().optional().nullable(),
  penaltyPoints: z.number().int().optional().nullable(),
  legalAction: z.boolean().default(false),
  courtDate: z.string().datetime().optional().nullable(),
});

export const updateIncidentSchema = createIncidentSchema.partial().extend({
  status: z.nativeEnum(IncidentStatus).optional(),
  investigationNotes: z.string().max(5000).optional().nullable(),
  rootCause: z.string().max(2000).optional().nullable(),
  resolution: z.string().max(2000).optional().nullable(),
  investigatedBy: z.string().uuid().optional().nullable(),
  resolvedBy: z.string().uuid().optional().nullable(),
  resolvedAt: z.string().datetime().optional().nullable(),
});

export const incidentSearchSchema = z.object({
  q: z.string().optional(),
  incidentType: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();
`);

write(`${BASE}/incident/repositories/incident.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

function generateIncidentNumber(): string { return 'INC-' + Date.now().toString(36).toUpperCase(); }

export class IncidentRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.IncidentWhereInput = { companyId, deletedAt: null };
    if (search.q) where.title = { contains: search.q, mode: 'insensitive' };
    if (search.incidentType) where.incidentType = search.incidentType;
    if (search.severity) where.severity = search.severity;
    if (search.status) where.status = search.status;
    if (search.vehicleId) where.vehicleId = search.vehicleId;
    if (search.driverId) where.driverId = search.driverId;

    const [data, total] = await Promise.all([
      prisma.incident.findMany({
        where, skip: (search.page - 1) * search.limit, take: search.limit,
        include: { vehicle: { select: { registrationNumber: true, make: true, model: true } }, driver: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.incident.count({ where }),
    ]);
    return { incidents: data, total };
  }

  async findById(id: string, companyId: string) {
    const incident = await prisma.incident.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { vehicle: true, driver: true, trip: true, attachments: true, correctiveActions: true },
    });
    if (!incident) throw new AppError('INCIDENT_NOT_FOUND', 'Incident not found', 404);
    return incident;
  }

  async create(companyId: string, data: any) {
    return prisma.incident.create({
      data: { ...data, companyId, incidentNumber: generateIncidentNumber() },
      include: { vehicle: true, driver: true },
    });
  }

  async update(id: string, companyId: string, data: any) {
    await this.findById(id, companyId);
    return prisma.incident.update({ where: { id }, data, include: { vehicle: true, driver: true } });
  }

  async delete(id: string, companyId: string) {
    await this.findById(id, companyId);
    return prisma.incident.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const incidentRepository = new IncidentRepository();
`);

write(`${BASE}/incident/services/incident.service.ts`, `import { incidentRepository } from '../repositories/incident.repository';

export class IncidentService {
  async getAll(companyId: string, search: any) { return incidentRepository.findAll(companyId, search); }
  async getById(id: string, companyId: string) { return incidentRepository.findById(id, companyId); }
  async create(companyId: string, data: any) { return incidentRepository.create(companyId, data); }
  async update(id: string, companyId: string, data: any) { return incidentRepository.update(id, companyId, data); }
  async delete(id: string, companyId: string) { return incidentRepository.delete(id, companyId); }
}

export const incidentService = new IncidentService();
`);

write(`${BASE}/incident/controllers/incident.controller.ts`, `import { NextRequest } from 'next/server';
import { incidentService } from '../services/incident.service';
import { createIncidentSchema, updateIncidentSchema, incidentSearchSchema } from '../validators/incident.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return Response.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return Response.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
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
`);

// ============== CORRECTIVE ACTION ==============
write(`${BASE}/corrective-action/validators/corrective-action.validator.ts`, `import { z } from 'zod';
import { CorrectiveActionStatus } from '@prisma/client';

export const createCorrectiveActionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  incidentId: z.string().uuid().optional().nullable(),
  vehicleId: z.string().uuid().optional().nullable(),
  driverId: z.string().uuid().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.number().int().min(1).max(10).default(1),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateCorrectiveActionSchema = createCorrectiveActionSchema.partial().extend({
  status: z.nativeEnum(CorrectiveActionStatus).optional(),
  completedAt: z.string().datetime().optional().nullable(),
  completedBy: z.string().uuid().optional().nullable(),
});

export const correctiveActionSearchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  assignedTo: z.string().optional(),
  incidentId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();
`);

write(`${BASE}/corrective-action/repositories/corrective-action.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class CorrectiveActionRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.CorrectiveActionWhereInput = { companyId, deletedAt: null };
    if (search.q) where.title = { contains: search.q, mode: 'insensitive' };
    if (search.status) where.status = search.status;
    if (search.assignedTo) where.assignedTo = search.assignedTo;
    if (search.incidentId) where.incidentId = search.incidentId;

    const [data, total] = await Promise.all([
      prisma.correctiveAction.findMany({
        where, skip: (search.page - 1) * search.limit, take: search.limit,
        include: { assignee: { select: { firstName: true, lastName: true } }, incident: { select: { title: true, incidentNumber: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.correctiveAction.count({ where }),
    ]);
    return { actions: data, total };
  }

  async findById(id: string, companyId: string) {
    const action = await prisma.correctiveAction.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { assignee: true, completer: true, incident: true, vehicle: true, driver: true },
    });
    if (!action) throw new AppError('ACTION_NOT_FOUND', 'Corrective action not found', 404);
    return action;
  }

  async create(companyId: string, data: any) { return prisma.correctiveAction.create({ data: { ...data, companyId } }); }
  async update(id: string, companyId: string, data: any) { await this.findById(id, companyId); return prisma.correctiveAction.update({ where: { id }, data }); }
  async delete(id: string, companyId: string) { await this.findById(id, companyId); return prisma.correctiveAction.update({ where: { id }, data: { deletedAt: new Date() } }); }
}

export const correctiveActionRepository = new CorrectiveActionRepository();
`);

write(`${BASE}/corrective-action/services/corrective-action.service.ts`, `import { correctiveActionRepository } from '../repositories/corrective-action.repository';

export class CorrectiveActionService {
  async getAll(companyId: string, search: any) { return correctiveActionRepository.findAll(companyId, search); }
  async getById(id: string, companyId: string) { return correctiveActionRepository.findById(id, companyId); }
  async create(companyId: string, data: any) { return correctiveActionRepository.create(companyId, data); }
  async update(id: string, companyId: string, data: any) { return correctiveActionRepository.update(id, companyId, data); }
  async delete(id: string, companyId: string) { return correctiveActionRepository.delete(id, companyId); }
}

export const correctiveActionService = new CorrectiveActionService();
`);

write(`${BASE}/corrective-action/controllers/corrective-action.controller.ts`, `import { NextRequest } from 'next/server';
import { correctiveActionService } from '../services/corrective-action.service';
import { createCorrectiveActionSchema, updateCorrectiveActionSchema, correctiveActionSearchSchema } from '../validators/corrective-action.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return Response.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return Response.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
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
`);

// ============== APPROVAL WORKFLOW ==============
write(`${BASE}/approval-workflow/validators/approval-workflow.validator.ts`, `import { z } from 'zod';

export const approvalStepSchema = z.object({
  stepNumber: z.number().int().min(1),
  name: z.string().min(1).max(200),
  approverId: z.string().uuid().optional().nullable(),
  approverRoleId: z.string().uuid().optional().nullable(),
  requiresAll: z.boolean().default(false),
});

export const createApprovalWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  workflowType: z.enum(['DOCUMENT', 'INSPECTION', 'CORRECTIVE_ACTION', 'EXCEPTION']),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  steps: z.array(approvalStepSchema).optional(),
});

export const updateApprovalWorkflowSchema = createApprovalWorkflowSchema.partial();

export const approvalWorkflowSearchSchema = z.object({
  q: z.string().optional(),
  workflowType: z.string().optional(),
  isActive: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();

export const createApprovalRequestSchema = z.object({
  workflowId: z.string().uuid(),
  entityType: z.enum(['DOCUMENT', 'INSPECTION', 'CORRECTIVE_ACTION', 'EXCEPTION']),
  entityId: z.string().uuid(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateApprovalRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
  decisionNotes: z.string().max(2000).optional().nullable(),
});
`);

write(`${BASE}/approval-workflow/repositories/approval-workflow.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class ApprovalWorkflowRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.ApprovalWorkflowWhereInput = { companyId, deletedAt: null };
    if (search.q) where.name = { contains: search.q, mode: 'insensitive' };
    if (search.workflowType) where.workflowType = search.workflowType;
    if (search.isActive !== undefined) where.isActive = search.isActive === 'true';

    const [data, total] = await Promise.all([
      prisma.approvalWorkflow.findMany({
        where, skip: (search.page - 1) * search.limit, take: search.limit,
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.approvalWorkflow.count({ where }),
    ]);
    return { workflows: data, total };
  }

  async findById(id: string, companyId: string) {
    const wf = await prisma.approvalWorkflow.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });
    if (!wf) throw new AppError('WORKFLOW_NOT_FOUND', 'Approval workflow not found', 404);
    return wf;
  }

  async create(companyId: string, data: any) {
    const { steps, ...wfData } = data;
    return prisma.approvalWorkflow.create({
      data: { ...wfData, companyId, steps: steps ? { create: steps } : undefined },
      include: { steps: true },
    });
  }

  async update(id: string, companyId: string, data: any) {
    await this.findById(id, companyId);
    const { steps, ...wfData } = data;
    return prisma.approvalWorkflow.update({
      where: { id },
      data: { ...wfData, steps: steps ? { deleteMany: {}, create: steps } : undefined },
      include: { steps: true },
    });
  }

  async delete(id: string, companyId: string) {
    await this.findById(id, companyId);
    return prisma.approvalWorkflow.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export class ApprovalRequestRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.ApprovalRequestWhereInput = { companyId, deletedAt: null };
    if (search.status) where.status = search.status;
    if (search.entityType) where.entityType = search.entityType;

    const [data, total] = await Promise.all([
      prisma.approvalRequest.findMany({
        where, skip: (search.page - 1) * search.limit, take: search.limit,
        include: { workflow: true, requester: { select: { firstName: true, lastName: true } }, decider: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.approvalRequest.count({ where }),
    ]);
    return { requests: data, total };
  }

  async findById(id: string, companyId: string) {
    const req = await prisma.approvalRequest.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { workflow: { include: { steps: true } }, requester: true, decider: true, steps: true },
    });
    if (!req) throw new AppError('REQUEST_NOT_FOUND', 'Approval request not found', 404);
    return req;
  }

  async create(companyId: string, data: any, userId: string) {
    return prisma.approvalRequest.create({
      data: { ...data, companyId, requesterId: userId },
      include: { workflow: true },
    });
  }

  async update(id: string, companyId: string, data: any, userId: string) {
    await this.findById(id, companyId);
    return prisma.approvalRequest.update({
      where: { id },
      data: { ...data, decidedBy: userId, decidedAt: new Date() },
    });
  }
}

export const approvalWorkflowRepository = new ApprovalWorkflowRepository();
export const approvalRequestRepository = new ApprovalRequestRepository();
`);

write(`${BASE}/approval-workflow/services/approval-workflow.service.ts`, `import { approvalWorkflowRepository, approvalRequestRepository } from '../repositories/approval-workflow.repository';

export class ApprovalWorkflowService {
  async getAll(companyId: string, search: any) { return approvalWorkflowRepository.findAll(companyId, search); }
  async getById(id: string, companyId: string) { return approvalWorkflowRepository.findById(id, companyId); }
  async create(companyId: string, data: any) { return approvalWorkflowRepository.create(companyId, data); }
  async update(id: string, companyId: string, data: any) { return approvalWorkflowRepository.update(id, companyId, data); }
  async delete(id: string, companyId: string) { return approvalWorkflowRepository.delete(id, companyId); }
}

export class ApprovalRequestService {
  async getAll(companyId: string, search: any) { return approvalRequestRepository.findAll(companyId, search); }
  async getById(id: string, companyId: string) { return approvalRequestRepository.findById(id, companyId); }
  async create(companyId: string, data: any, userId: string) { return approvalRequestRepository.create(companyId, data, userId); }
  async update(id: string, companyId: string, data: any, userId: string) { return approvalRequestRepository.update(id, companyId, data, userId); }
}

export const approvalWorkflowService = new ApprovalWorkflowService();
export const approvalRequestService = new ApprovalRequestService();
`);

write(`${BASE}/approval-workflow/controllers/approval-workflow.controller.ts`, `import { NextRequest } from 'next/server';
import { approvalWorkflowService, approvalRequestService } from '../services/approval-workflow.service';
import { createApprovalWorkflowSchema, updateApprovalWorkflowSchema, approvalWorkflowSearchSchema, createApprovalRequestSchema, updateApprovalRequestSchema } from '../validators/approval-workflow.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return Response.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return Response.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
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
`);

// ============== COMPLIANCE ANALYTICS ==============
write(`${BASE}/compliance-analytics/validators/compliance-analytics.validator.ts`, `import { z } from 'zod';

export const complianceAnalyticsSearchSchema = z.object({
  days: z.number().int().min(1).max(365).default(30),
}).partial();
`);

write(`${BASE}/compliance-analytics/repositories/compliance-analytics.repository.ts`, `import { prisma } from '@/lib/prisma';

export class ComplianceAnalyticsRepository {
  async overview(companyId: string) {
    const [totalRules, activeRules, totalIncidents, openIncidents, totalActions, pendingActions, overdueActions, totalChecks, failedChecks, expiringDocs, totalInspections, failedInspections] = await Promise.all([
      prisma.complianceRule.count({ where: { companyId, deletedAt: null } }),
      prisma.complianceRule.count({ where: { companyId, deletedAt: null, status: 'ACTIVE' } }),
      prisma.incident.count({ where: { companyId, deletedAt: null } }),
      prisma.incident.count({ where: { companyId, deletedAt: null, status: { in: ['OPEN', 'INVESTIGATING'] } } }),
      prisma.correctiveAction.count({ where: { companyId, deletedAt: null } }),
      prisma.correctiveAction.count({ where: { companyId, deletedAt: null, status: 'PENDING' } }),
      prisma.correctiveAction.count({ where: { companyId, deletedAt: null, status: 'PENDING', dueDate: { lt: new Date() } } }),
      prisma.complianceCheck.count({ where: { companyId, deletedAt: null } }),
      prisma.complianceCheck.count({ where: { companyId, deletedAt: null, status: 'FAIL' } }),
      prisma.vehicleDocument.count({ where: { companyId, deletedAt: null, expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } } }),
      prisma.inspection.count({ where: { companyId, deletedAt: null } }),
      prisma.inspection.count({ where: { companyId, deletedAt: null, result: 'FAIL' } }),
    ]);
    return { totalRules, activeRules, totalIncidents, openIncidents, totalActions, pendingActions, overdueActions, totalChecks, failedChecks, expiringDocs, totalInspections, failedInspections };
  }

  async complianceScore(companyId: string) {
    const totalChecks = await prisma.complianceCheck.count({ where: { companyId, deletedAt: null } });
    const passedChecks = await prisma.complianceCheck.count({ where: { companyId, deletedAt: null, status: 'PASS' } });
    return totalChecks === 0 ? 100 : Math.round((passedChecks / totalChecks) * 100);
  }

  async incidentTrends(companyId: string, days: number) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.incident.groupBy({
      by: ['incidentType'],
      where: { companyId, deletedAt: null, createdAt: { gte: startDate } },
      _count: { id: true },
    });
  }
}

export const complianceAnalyticsRepository = new ComplianceAnalyticsRepository();
`);

write(`${BASE}/compliance-analytics/services/compliance-analytics.service.ts`, `import { complianceAnalyticsRepository } from '../repositories/compliance-analytics.repository';

export class ComplianceAnalyticsService {
  async overview(companyId: string) { return complianceAnalyticsRepository.overview(companyId); }
  async complianceScore(companyId: string) { return complianceAnalyticsRepository.complianceScore(companyId); }
  async incidentTrends(companyId: string, days: number) { return complianceAnalyticsRepository.incidentTrends(companyId, days); }
}

export const complianceAnalyticsService = new ComplianceAnalyticsService();
`);

write(`${BASE}/compliance-analytics/controllers/compliance-analytics.controller.ts`, `import { NextRequest } from 'next/server';
import { complianceAnalyticsService } from '../services/compliance-analytics.service';
import { complianceAnalyticsSearchSchema } from '../validators/compliance-analytics.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return Response.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return Response.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
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
`);

console.log('Phase 13 backend modules created');
console.log('Modules: compliance-rule, inspection-template, incident, corrective-action, approval-workflow, compliance-analytics');
