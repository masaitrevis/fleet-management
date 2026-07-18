const fs = require('fs');
const path = require('path');

const API = '/root/.openclaw/workspace/fleet-management-saas/src/app/api';

function mkdir(p) { fs.mkdirSync(p, { recursive: true }); }
function write(f, c) { mkdir(path.dirname(f)); fs.writeFileSync(f, c); }

function listRoute(controller, ctrlImport, permPrefix) {
  return `import { NextRequest } from 'next/server';
import { ${controller} } from '${ctrlImport}';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('${permPrefix}:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return ${controller}.getAll(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('${permPrefix}:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return ${controller}.create(req, companyId);
    }
  )
);`;
}

function detailRoute(controller, ctrlImport, permPrefix) {
  return `import { NextRequest } from 'next/server';
import { ${controller} } from '${ctrlImport}';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('${permPrefix}:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return ${controller}.getById(req, companyId, id);
    }
  )
);

export const PUT = withAuth(
  requirePermission('${permPrefix}:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return ${controller}.update(req, companyId, id);
    }
  )
);

export const DELETE = withAuth(
  requirePermission('${permPrefix}:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return ${controller}.delete(req, companyId, id);
    }
  )
);`;
}

// Compliance Rules
write(`${API}/compliance/rules/route.ts`, listRoute('complianceRuleController', '@/modules/compliance-rule/controllers/compliance-rule.controller', 'compliance'));
write(`${API}/compliance/rules/[id]/route.ts`, detailRoute('complianceRuleController', '@/modules/compliance-rule/controllers/compliance-rule.controller', 'compliance'));

// Inspection Templates
write(`${API}/inspections/templates/route.ts`, listRoute('inspectionTemplateController', '@/modules/inspection-template/controllers/inspection-template.controller', 'inspections'));
write(`${API}/inspections/templates/[id]/route.ts`, detailRoute('inspectionTemplateController', '@/modules/inspection-template/controllers/inspection-template.controller', 'inspections'));

// Incidents
write(`${API}/incidents/route.ts`, listRoute('incidentController', '@/modules/incident/controllers/incident.controller', 'incidents'));
write(`${API}/incidents/[id]/route.ts`, detailRoute('incidentController', '@/modules/incident/controllers/incident.controller', 'incidents'));

// Corrective Actions
write(`${API}/corrective-actions/route.ts`, listRoute('correctiveActionController', '@/modules/corrective-action/controllers/corrective-action.controller', 'corrective'));
write(`${API}/corrective-actions/[id]/route.ts`, detailRoute('correctiveActionController', '@/modules/corrective-action/controllers/corrective-action.controller', 'corrective'));

// Approval Workflows
write(`${API}/approvals/workflows/route.ts`, listRoute('approvalWorkflowController', '@/modules/approval-workflow/controllers/approval-workflow.controller', 'approvals'));
write(`${API}/approvals/workflows/[id]/route.ts`, detailRoute('approvalWorkflowController', '@/modules/approval-workflow/controllers/approval-workflow.controller', 'approvals'));

// Approval Requests
write(`${API}/approvals/requests/route.ts`, `import { NextRequest } from 'next/server';
import { approvalRequestController } from '@/modules/approval-workflow/controllers/approval-workflow.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('approvals:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return approvalRequestController.getAll(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('approvals:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return approvalRequestController.create(req, companyId);
    }
  )
);`);

write(`${API}/approvals/requests/[id]/route.ts`, `import { NextRequest } from 'next/server';
import { approvalRequestController } from '@/modules/approval-workflow/controllers/approval-workflow.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('approvals:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return approvalRequestController.getById(req, companyId, id);
    }
  )
);

export const PUT = withAuth(
  requirePermission('approvals:manage')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return approvalRequestController.update(req, companyId, id);
    }
  )
);`);

// Compliance Analytics
write(`${API}/compliance/analytics/route.ts`, `import { NextRequest } from 'next/server';
import { complianceAnalyticsController } from '@/modules/compliance-analytics/controllers/compliance-analytics.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('compliance:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return complianceAnalyticsController.overview(req, companyId);
    }
  )
);`);

write(`${API}/compliance/analytics/score/route.ts`, `import { NextRequest } from 'next/server';
import { complianceAnalyticsController } from '@/modules/compliance-analytics/controllers/compliance-analytics.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('compliance:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return complianceAnalyticsController.score(req, companyId);
    }
  )
);`);

write(`${API}/compliance/analytics/trends/route.ts`, `import { NextRequest } from 'next/server';
import { complianceAnalyticsController } from '@/modules/compliance-analytics/controllers/compliance-analytics.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('compliance:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return complianceAnalyticsController.trends(req, companyId);
    }
  )
);`);

console.log('Phase 13 API routes created');
