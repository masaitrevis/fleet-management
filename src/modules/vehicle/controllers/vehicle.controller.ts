import { NextRequest, NextResponse } from 'next/server';
import {
  vehicleService,
  vehicleDocumentService,
  vehicleImageService,
  vehicleCategoryService,
} from '../services/vehicle.service';
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleSearchSchema,
  vehicleAssignmentSchema,
  odometerSchema,
  createVehicleDocumentSchema,
  updateVehicleDocumentSchema,
  createVehicleCategorySchema,
} from '../validators/vehicle.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.statusCode }
    );
  }
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
    { status: 500 }
  );
}

export class VehicleController {
  async getAll(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const { searchParams } = new URL(req.url);
      const searchInput = vehicleSearchSchema.parse({
        q: searchParams.get('q') || undefined,
        status: searchParams.get('status') || undefined,
        category: searchParams.get('category') || undefined,
        make: searchParams.get('make') || undefined,
        model: searchParams.get('model') || undefined,
        fuelType: searchParams.get('fuelType') || undefined,
        branchId: searchParams.get('branchId') || undefined,
        departmentId: searchParams.get('departmentId') || undefined,
        yearFrom: searchParams.get('yearFrom') ? Number(searchParams.get('yearFrom')) : undefined,
        yearTo: searchParams.get('yearTo') ? Number(searchParams.get('yearTo')) : undefined,
        assignedDriverId: searchParams.get('assignedDriverId') || undefined,
        availability: searchParams.get('availability') || undefined,
        page: Number(searchParams.get('page') || '1'),
        limit: Number(searchParams.get('limit') || '50'),
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      });
      const result = await vehicleService.getAll(companyId, searchInput);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getById(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await vehicleService.getById(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async create(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = createVehicleSchema.parse(body);
      const result = await vehicleService.create(companyId, data, userId);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async update(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = updateVehicleSchema.parse(body);
      const result = await vehicleService.update(params.id, companyId, data, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async delete(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const result = await vehicleService.delete(params.id, companyId, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async assign(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = vehicleAssignmentSchema.parse(body);
      const result = await vehicleService.assignDriver(params.id, companyId, data, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async unassign(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const result = await vehicleService.unassignDriver(params.id, companyId, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async addOdometer(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = odometerSchema.parse(body);
      const result = await vehicleService.addOdometer(params.id, companyId, data, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getFilters(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await vehicleService.getFilters(companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export class VehicleDocumentController {
  async getAll(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await vehicleDocumentService.getAll(params.id, companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async create(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = createVehicleDocumentSchema.parse({ ...body, vehicleId: params.id });
      const result = await vehicleDocumentService.create(params.id, companyId, data, userId);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async update(req: NextRequest, { params }: { params: { id: string; documentId: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = updateVehicleDocumentSchema.parse(body);
      const result = await vehicleDocumentService.update(params.documentId, params.id, companyId, data, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async delete(req: NextRequest, { params }: { params: { id: string; documentId: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const result = await vehicleDocumentService.delete(params.documentId, params.id, companyId, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export class VehicleImageController {
  async upload(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const isPrimary = formData.get('isPrimary') === 'true';
      if (!file) throw new AppError('No file uploaded', 400, 'VALIDATION_ERROR');
      // In production, upload to Cloudinary here
      const imageUrl = `https://storage.example.com/vehicles/${params.id}/${Date.now()}`;
      const thumbnailUrl = `${imageUrl}-thumb`;
      const result = await vehicleImageService.upload(params.id, companyId, imageUrl, thumbnailUrl, isPrimary, userId);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async delete(req: NextRequest, { params }: { params: { id: string; imageId: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const result = await vehicleImageService.delete(params.imageId, params.id, companyId, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export class VehicleCategoryController {
  async getAll(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const result = await vehicleCategoryService.getAll(companyId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async create(req: NextRequest) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const body = await req.json();
      const data = createVehicleCategorySchema.parse(body);
      const result = await vehicleCategoryService.create(companyId, data, userId);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async delete(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const companyId = req.headers.get('x-company-id')!;
      const userId = req.headers.get('x-user-id')!;
      const result = await vehicleCategoryService.delete(params.id, companyId, userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const vehicleController = new VehicleController();
export const vehicleDocumentController = new VehicleDocumentController();
export const vehicleImageController = new VehicleImageController();
export const vehicleCategoryController = new VehicleCategoryController();
