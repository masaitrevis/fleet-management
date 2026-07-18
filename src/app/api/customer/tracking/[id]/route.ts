import { NextRequest } from 'next/server';
import { CustomerPortalController } from '@/modules/portal/controllers/customer.controller';
import { withCustomerAuth } from '@/modules/portal/middleware/portal-auth.middleware';

export const GET = withCustomerAuth(async (req, customerId, companyId, params: { id: string }) => 
  CustomerPortalController.getTracking(req, customerId, companyId, params.id));
