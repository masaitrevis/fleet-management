import { NextRequest } from 'next/server';
import { CustomerPortalController } from '@/modules/portal/controllers/customer.controller';
import { withCustomerAuth } from '@/modules/portal/middleware/portal-auth.middleware';

export const GET = withCustomerAuth(async (req, customerId, companyId) => 
  CustomerPortalController.getProfile(req, customerId, companyId));

export const PATCH = withCustomerAuth(async (req, customerId, companyId) => 
  CustomerPortalController.updateProfile(req, customerId, companyId));
