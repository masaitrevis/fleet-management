import { NextRequest } from 'next/server';
import { authController } from '@/modules/auth/controllers/auth.controller';
import { authRateLimit } from '@/modules/auth/middleware/rateLimit.middleware';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';

export const POST = authRateLimit(async (req: NextRequest) => {
  return authController.registerUser(req);
});
