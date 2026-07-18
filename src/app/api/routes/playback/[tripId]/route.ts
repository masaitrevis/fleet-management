import { NextRequest } from 'next/server';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

async function handler(req: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const companyId = req.headers.get('x-company-id')!;
    const tripId = params.tripId;

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, companyId },
    });
    if (!trip) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Trip not found' } }, { status: 404 });
    }

    const [locations, telemetry] = await Promise.all([
      prisma.vehicleLocation.findMany({
        where: { vehicleId: trip.vehicleId, companyId, timestamp: { gte: trip.startTime ?? undefined } },
        orderBy: { timestamp: 'asc' },
      }),
      prisma.telemetryData.findMany({
        where: { vehicleId: trip.vehicleId, companyId, timestamp: { gte: trip.startTime ?? undefined } },
        orderBy: { timestamp: 'asc' },
      }),
    ]);

    return NextResponse.json({ success: true, data: { trip, locations, telemetry } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export const GET = withAuth(
  requirePermission('trips:read')(
    async (req: NextRequest, { params }: { params: { tripId: string } }) => handler(req, { params })
  )
);
