import { NextRequest } from 'next/server';
import { SubscriptionController } from '@/modules/billing/controllers/subscription.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';

export const GET = withAuth(async (req: NextRequest) => {
  return SubscriptionController.listPlans(req);
});
