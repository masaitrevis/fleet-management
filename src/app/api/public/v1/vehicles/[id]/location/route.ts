import { NextRequest } from 'next/server';
import { PublicApiController } from '@/modules/portal/controllers/public-api.controller';

export const GET = async (req: NextRequest) => {
  const parts = req.url.split('/');
  const id = parts[parts.length - 2].split('?')[0];
  return PublicApiController.getVehicleLocation(req, id);
};
