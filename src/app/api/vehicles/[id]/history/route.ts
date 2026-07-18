import { NextRequest } from 'next/server';
import { vehicleAssignmentRepository } from '@/modules/vehicle/repositories/vehicle.repository';
import { vehicleRepository } from '@/modules/vehicle/repositories/vehicle.repository';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';
import { NextResponse } from 'next/server';

export const GET = withAuth(
  requirePermission('vehicles:read')(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      try {
        const companyId = req.headers.get('x-company-id')!;
        const vehicle = await vehicleRepository.findById(params.id, companyId);
        if (!vehicle) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Vehicle not found' } }, { status: 404 });
        const history = await vehicleAssignmentRepository.findByVehicle(params.id);
        return NextResponse.json({ success: true, data: history });
      } catch (error) {
        return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
      }
    }
  )
);
