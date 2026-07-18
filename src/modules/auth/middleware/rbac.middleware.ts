import { NextRequest, NextResponse } from 'next/server';
import { AppError, ForbiddenError } from '@/shared/errors/AppError';

export function requireRole(...allowedRoles: string[]) {
  return (handler: (req: NextRequest, context?: any) => Promise<NextResponse>) => {
    return async (req: NextRequest, context?: any) => {
      try {
        const userRolesHeader = req.headers.get('x-user-roles');
        if (!userRolesHeader) {
          throw new ForbiddenError('Role information not available');
        }

        const userRoles = JSON.parse(userRolesHeader);
        const hasRole = allowedRoles.some(role => userRoles.includes(role));

        if (!hasRole) {
          throw new ForbiddenError('Insufficient role permissions');
        }

        return handler(req, context);
      } catch (error) {
        if (error instanceof AppError) {
          return NextResponse.json(
            { success: false, error: { code: error.code, message: error.message } },
            { status: error.statusCode }
          );
        }
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
          { status: 403 }
        );
      }
    };
  };
}

export function requirePermission(...requiredPermissions: string[]) {
  return (handler: (req: NextRequest, context?: any) => Promise<NextResponse>) => {
    return async (req: NextRequest, context?: any) => {
      try {
        const userPermissionsHeader = req.headers.get('x-user-permissions');
        if (!userPermissionsHeader) {
          throw new ForbiddenError('Permission information not available');
        }

        const userPermissions = JSON.parse(userPermissionsHeader);
        const hasAllPermissions = requiredPermissions.every(p => userPermissions.includes(p));

        if (!hasAllPermissions) {
          throw new ForbiddenError('Insufficient permissions');
        }

        return handler(req, context);
      } catch (error) {
        if (error instanceof AppError) {
          return NextResponse.json(
            { success: false, error: { code: error.code, message: error.message } },
            { status: error.statusCode }
          );
        }
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
          { status: 403 }
        );
      }
    };
  };
}
