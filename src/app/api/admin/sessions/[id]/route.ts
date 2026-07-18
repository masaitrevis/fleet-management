import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';
import { prisma } from '@/lib/prisma';

export const DELETE = withAdminAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await prisma.session.delete({ where: { id } });
  return NextResponse.json({ success: true, data: { message: 'Session terminated' } });
});
