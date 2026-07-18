import { NextRequest } from 'next/server';
import { companyController } from '@/modules/company/controllers/company.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(async (req: NextRequest) => {
  return companyController.getCompany(req);
});

export const PUT = withAuth(
  requirePermission('company:update')(
    async (req: NextRequest) => {
      return companyController.updateCompany(req);
    }
  )
);
