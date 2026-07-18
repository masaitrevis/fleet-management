import { NextRequest } from 'next/server';
import { CustomerPortalController } from '@/modules/portal/controllers/customer.controller';
import { withCustomerAuth } from '@/modules/portal/middleware/portal-auth.middleware';

export const POST = withCustomerAuth(async (req, customerId, companyId) => 
  CustomerPortalController.submitSupport(req, customerId, companyId));
