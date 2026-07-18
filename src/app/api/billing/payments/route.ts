import { NextRequest } from 'next/server';
import { BillingController } from '@/modules/billing/controllers/billing.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';

export const GET = withAuth(async (req: NextRequest) => {
  const companyId = req.headers.get('x-company-id')!;
  return BillingController.getPaymentHistory(req, companyId);
});

export const POST = withAuth(async (req: NextRequest) => {
  const companyId = req.headers.get('x-company-id')!;
  return BillingController.processPayment(req, companyId);
});
