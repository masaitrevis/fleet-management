import { NextRequest } from 'next/server';
import { authController } from '@/modules/auth/controllers/auth.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';

export const POST = withAuth(async (req: NextRequest) => {
  return authController.changePassword(req);
});
