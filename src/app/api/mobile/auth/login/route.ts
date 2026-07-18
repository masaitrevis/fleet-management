import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json();
  return NextResponse.json({ 
    success: true, 
    message: 'Driver authenticated via main auth system. Use /api/auth/login.', 
    deviceToken: body.deviceId 
  });
});
