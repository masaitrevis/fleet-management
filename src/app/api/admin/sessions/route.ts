import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAdminAuth(async (req: NextRequest) => {
  const sessions = await prisma.session.findMany({
    where: { expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    },
  });
  return NextResponse.json({ success: true, data: sessions });
});
