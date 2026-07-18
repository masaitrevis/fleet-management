import { NextRequest } from 'next/server';
import { BillingController } from '@/modules/billing/controllers/billing.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';

export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const companyId = req.headers.get('x-company-id')!;
  return BillingController.getInvoiceById(req, companyId, params.id);
});

export const POST = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const companyId = req.headers.get('x-company-id')!;
  return BillingController.createCreditNote(req, companyId, params.id);
});
