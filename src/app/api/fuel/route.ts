import { NextRequest } from 'next/server';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { NextResponse } from 'next/server';

export const GET = withAuth(
  async (req: NextRequest) => {
    return NextResponse.json({ success: true, data: { message: 'Fuel Management API' } });
  }
);
