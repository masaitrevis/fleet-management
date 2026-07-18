import { NextRequest } from 'next/server';
import { PublicApiController } from '@/modules/portal/controllers/public-api.controller';

export const GET = async (req: NextRequest) => PublicApiController.getVehicles(req);
