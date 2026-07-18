import { NextRequest, NextResponse } from 'next/server';
import { AppError, TooManyRequestsError } from '@/shared/errors/AppError';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store - replace with Redis in production
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

const defaultOptions: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
};

function getClientKey(req: NextRequest, options: RateLimitOptions): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             req.headers.get('x-real-ip') || 
             'unknown';
  const prefix = options.keyPrefix || 'default';
  return `${prefix}:${ip}`;
}

export function rateLimit(options: Partial<RateLimitOptions> = {}) {
  const config = { ...defaultOptions, ...options };

  return (handler: (req: NextRequest, context?: any) => Promise<NextResponse>) => {
    return async (req: NextRequest, context?: any) => {
      try {
        const key = getClientKey(req, config);
        const now = Date.now();

        const entry = rateLimitStore.get(key);

        if (!entry || now > entry.resetTime) {
          // New window
          rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
          });
          return handler(req, context);
        }

        if (entry.count >= config.maxRequests) {
          throw new TooManyRequestsError(
            `Rate limit exceeded. Try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds`
          );
        }

        entry.count++;
        return handler(req, context);
      } catch (error) {
        if (error instanceof AppError) {
          const response = NextResponse.json(
            { success: false, error: { code: error.code, message: error.message } },
            { status: error.statusCode }
          );
          
          if (error.statusCode === 429) {
            const entry = rateLimitStore.get(getClientKey(req, config));
            if (entry) {
              response.headers.set('Retry-After', String(Math.ceil((entry.resetTime - Date.now()) / 1000)));
            }
          }
          
          return response;
        }
        return NextResponse.json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
          { status: 500 }
        );
      }
    };
  };
}

// Pre-configured rate limiters
export const authRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  keyPrefix: 'auth',
});

export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  keyPrefix: 'password-reset',
});
