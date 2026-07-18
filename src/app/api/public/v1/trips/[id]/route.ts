import { NextRequest } from 'next/server';
import { PublicApiController } from '@/modules/portal/controllers/public-api.controller';

export const GET = async (req: NextRequest) => {
  const id = req.url.split('/').pop()!.split('?')[0];
  return PublicApiController.getTripById(req, id);
};
