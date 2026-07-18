// Auth Module Exports

// Controllers
export { authController } from './controllers/auth.controller';

// Services
export { authService } from './services/auth.service';

// Repositories
export { authRepository } from './repositories/auth.repository';

// Middleware
export { authMiddleware, withAuth } from './middleware/auth.middleware';
export { requireRole, requirePermission } from './middleware/rbac.middleware';
export { tenantMiddleware } from './middleware/tenant.middleware';
export { rateLimit, authRateLimit, passwordResetRateLimit } from './middleware/rateLimit.middleware';
export { errorHandler } from './middleware/error.middleware';

// Validators
export * from './validators/auth.validator';

// Types
export * from './types/auth.types';

// Utils
export * from './utils/jwt';
export * from './utils/password';
export * from './utils/crypto';
export { sendEmail } from './utils/email';
