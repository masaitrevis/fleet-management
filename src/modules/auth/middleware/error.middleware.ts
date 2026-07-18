import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/shared/errors/AppError';
import { ZodError } from 'zod';

export function errorHandler(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { success: false, error: { code: error.code, message: error.message } },
          { status: error.statusCode }
        );
      }

      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: formattedErrors } },
          { status: 400 }
        );
      }

      // Log unexpected errors
      console.error('Unexpected error:', error);

      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        { status: 500 }
      );
    }
  };
}
