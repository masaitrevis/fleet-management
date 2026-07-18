import { NextRequest } from 'next/server';
import { CustomerAuthController } from '@/modules/portal/controllers/customer.controller';
import { withCustomerAuth } from '@/modules/portal/middleware/portal-auth.middleware';

export const POST = withCustomerAuth(async (req, customerId) => CustomerAuthController.changePassword(req, customerId));
