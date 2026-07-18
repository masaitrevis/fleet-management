import { NextRequest } from 'next/server';
import { authController } from '@/modules/auth/controllers/auth.controller';
import { passwordResetRateLimit } from '@/modules/auth/middleware/rateLimit.middleware';

export const POST = passwordResetRateLimit(async (req: NextRequest) => {
  return authController.forgotPassword(req);
});
