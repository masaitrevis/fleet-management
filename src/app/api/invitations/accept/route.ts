import { NextRequest } from 'next/server';
import { invitationController } from '@/modules/invitation/controllers/invitation.controller';

export const POST = async (req: NextRequest) => {
  return invitationController.accept(req);
};
