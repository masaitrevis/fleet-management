import { NextRequest } from 'next/server';
import { SubscriptionController } from '@/modules/billing/controllers/subscription.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';

export const POST = withAuth(async (req: NextRequest) => {
  const companyId = req.headers.get('x-company-id')!;
  return SubscriptionController.downgrade(req, companyId);
});
