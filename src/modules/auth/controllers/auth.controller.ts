import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../services/auth.service';
import {
  registerCompanySchema,
  registerUserSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '../validators/auth.validator';
import { AppError } from '@/shared/errors/AppError';

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

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

export class AuthController {
  async registerCompany(req: NextRequest) {
    try {
      const body = await req.json();
      const data = registerCompanySchema.parse(body);
      const result = await authService.registerCompany(
        data,
        getClientIp(req),
        req.headers.get('user-agent') || undefined
      );
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async registerUser(req: NextRequest) {
    try {
      const body = await req.json();
      const data = registerUserSchema.parse(body);
      const result = await authService.registerUser(data);
      return successResponse(result, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async login(req: NextRequest) {
    try {
      const body = await req.json();
      const data = loginSchema.parse(body);
      const result = await authService.login(
        data,
        getClientIp(req),
        req.headers.get('user-agent') || undefined
      );

      // Set refresh token in httpOnly cookie
      const response = successResponse({
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
      });

      response.cookies.set('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      return response;
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async logout(req: NextRequest) {
    try {
      const refreshToken = req.cookies.get('refreshToken')?.value;
      const userId = req.headers.get('x-user-id') || undefined;

      if (refreshToken) {
        await authService.logout(refreshToken, userId);
      }

      const response = successResponse({ message: 'Logged out successfully' });
      response.cookies.delete('refreshToken');
      return response;
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async refresh(req: NextRequest) {
    try {
      const refreshToken = req.cookies.get('refreshToken')?.value;
      if (!refreshToken) {
        throw new AppError('No refresh token', 401, 'UNAUTHORIZED');
      }

      const result = await authService.refresh(refreshToken);

      const response = successResponse({
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      });

      response.cookies.set('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async forgotPassword(req: NextRequest) {
    try {
      const body = await req.json();
      const data = forgotPasswordSchema.parse(body);
      const result = await authService.forgotPassword(data);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async resetPassword(req: NextRequest) {
    try {
      const body = await req.json();
      const data = resetPasswordSchema.parse(body);
      const result = await authService.resetPassword(data);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async changePassword(req: NextRequest) {
    try {
      const userId = req.headers.get('x-user-id');
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const body = await req.json();
      const data = changePasswordSchema.parse(body);
      const result = await authService.changePassword(userId, data);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async verifyEmail(req: NextRequest) {
    try {
      const body = await req.json();
      const data = verifyEmailSchema.parse(body);
      const result = await authService.verifyEmail(data);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async resendVerification(req: NextRequest) {
    try {
      const body = await req.json();
      const data = resendVerificationSchema.parse(body);
      const result = await authService.resendVerification(data);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getMe(req: NextRequest) {
    try {
      const userId = req.headers.get('x-user-id');
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const result = await authService.getMe(userId);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const authController = new AuthController();
