import { NextRequest } from 'next/server';
import { CustomerAuthController } from '@/modules/portal/controllers/customer.controller';

export const POST = async (req: NextRequest) => CustomerAuthController.login(req);
