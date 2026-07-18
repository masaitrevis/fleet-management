import { NextRequest } from 'next/server';
import { authController } from '@/modules/auth/controllers/auth.controller';

export const POST = async (req: NextRequest) => {
  return authController.verifyEmail(req);
};
