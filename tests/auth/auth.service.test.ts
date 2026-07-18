import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../services/auth.service';
import { authRepository } from '../repositories/auth.repository';
import * as passwordUtils from '../utils/password';
import * as jwtUtils from '../utils/jwt';
import * as cryptoUtils from '../utils/crypto';
import { BadRequestError, UnauthorizedError, NotFoundError, ConflictError } from '@/shared/errors/AppError';
import { UserStatus, CompanyStatus } from '@prisma/client';

// Mock dependencies
vi.mock('../repositories/auth.repository', () => ({
  authRepository: {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    findUserByVerificationToken: vi.fn(),
    findUserByResetToken: vi.fn(),
    createCompanyAndOwner: vi.fn(),
    createUser: vi.fn(),
    updateUserLoginSuccess: vi.fn(),
    incrementFailedLogin: vi.fn(),
    lockUserAccount: vi.fn(),
    setEmailVerificationToken: vi.fn(),
    verifyEmail: vi.fn(),
    setPasswordResetToken: vi.fn(),
    updatePassword: vi.fn(),
    createSession: vi.fn(),
    findSessionByTokenHash: vi.fn(),
    revokeSession: vi.fn(),
    revokeAllUserSessions: vi.fn(),
    createAuditLog: vi.fn(),
    findCompanyBySlug: vi.fn(),
    findCompanyById: vi.fn(),
  },
}));

vi.mock('../utils/password', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}));

vi.mock('../utils/jwt', () => ({
  generateAccessToken: vi.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
  verifyRefreshToken: vi.fn(),
}));

vi.mock('../utils/crypto', () => ({
  generateVerificationToken: vi.fn().mockReturnValue('mock-verify-token'),
  generateResetToken: vi.fn().mockReturnValue('mock-reset-token'),
  hashToken: vi.fn().mockReturnValue('hashed-token'),
}));

vi.mock('../utils/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerCompany', () => {
    const validInput = {
      companyName: 'Test Company',
      companySlug: 'test-company',
      companyEmail: 'company@test.com',
      companyPhone: '+1234567890',
      companyAddress: '123 Test St',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      phone: '+1234567890',
      password: 'Password123!',
    };

    it('should register a company and owner successfully', async () => {
      vi.mocked(authRepository.findCompanyBySlug).mockResolvedValue(null);
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);
      vi.mocked(passwordUtils.hashPassword).mockResolvedValue('hashed-password');
      vi.mocked(authRepository.createCompanyAndOwner).mockResolvedValue({
        company: { id: 'comp-1', name: 'Test Company', slug: 'test-company' },
        user: { id: 'user-1', email: 'john@test.com', firstName: 'John', lastName: 'Doe' },
      } as any);

      const result = await authService.registerCompany(validInput);

      expect(result).toEqual({
        user: { id: 'user-1', email: 'john@test.com', firstName: 'John', lastName: 'Doe' },
        company: { id: 'comp-1', name: 'Test Company', slug: 'test-company' },
        message: 'Company registered successfully. Please verify your email.',
      });
    });

    it('should throw ConflictError if company slug exists', async () => {
      vi.mocked(authRepository.findCompanyBySlug).mockResolvedValue({ id: 'existing' } as any);

      await expect(authService.registerCompany(validInput)).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError if user email exists', async () => {
      vi.mocked(authRepository.findCompanyBySlug).mockResolvedValue(null);
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue({ id: 'existing-user' } as any);

      await expect(authService.registerCompany(validInput)).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    const validLogin = { email: 'john@test.com', password: 'Password123!' };

    const mockUser = {
      id: 'user-1',
      email: 'john@test.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: null,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      passwordHash: 'hashed-password',
      failedLoginAttempts: 0,
      lockedUntil: null,
      companyUsers: [{
        companyId: 'comp-1',
        isOwner: true,
        company: { id: 'comp-1', name: 'Test Company', slug: 'test-company', status: CompanyStatus.ACTIVE },
      }],
      userRoles: [{
        role: { id: 'role-1', name: 'Owner', permissions: ['company:read', 'vehicle:create'] },
      }],
    };

    it('should login successfully with valid credentials', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(passwordUtils.comparePassword).mockResolvedValue(true);
      vi.mocked(authRepository.createSession).mockResolvedValue({} as any);

      const result = await authService.login(validLogin);

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user.email).toBe('john@test.com');
      expect(result.user.isOwner).toBe(true);
    });

    it('should throw UnauthorizedError for invalid email', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);

      await expect(authService.login(validLogin)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for invalid password', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(passwordUtils.comparePassword).mockResolvedValue(false);
      vi.mocked(authRepository.incrementFailedLogin).mockResolvedValue({ failedLoginAttempts: 1 } as any);

      await expect(authService.login(validLogin)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw ForbiddenError if email not verified', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      } as any);

      await expect(authService.login(validLogin)).rejects.toThrow('Email not verified');
    });

    it('should throw TooManyRequestsError if account locked', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue({
        ...mockUser,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      } as any);

      await expect(authService.login(validLogin)).rejects.toThrow('Account locked');
    });
  });

  describe('logout', () => {
    it('should revoke session and return success', async () => {
      vi.mocked(authRepository.revokeSession).mockResolvedValue({ count: 1 } as any);

      const result = await authService.logout('refresh-token');

      expect(result.message).toBe('Logged out successfully');
      expect(authRepository.revokeSession).toHaveBeenCalledWith('hashed-token');
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email for existing user', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue({
        id: 'user-1',
        email: 'john@test.com',
        firstName: 'John',
      } as any);

      const result = await authService.forgotPassword({ email: 'john@test.com' });

      expect(result.message).toContain('If an account exists');
      expect(authRepository.setPasswordResetToken).toHaveBeenCalled();
    });

    it('should return same message for non-existent user', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);

      const result = await authService.forgotPassword({ email: 'unknown@test.com' });

      expect(result.message).toContain('If an account exists');
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      vi.mocked(authRepository.findUserByResetToken).mockResolvedValue({
        id: 'user-1',
        email: 'john@test.com',
        firstName: 'John',
      } as any);
      vi.mocked(passwordUtils.hashPassword).mockResolvedValue('new-hashed-password');

      const result = await authService.resetPassword({
        token: 'valid-token',
        password: 'NewPassword123!',
      });

      expect(result.message).toBe('Password reset successfully');
      expect(authRepository.updatePassword).toHaveBeenCalledWith('user-1', 'new-hashed-password');
    });

    it('should throw BadRequestError for invalid token', async () => {
      vi.mocked(authRepository.findUserByResetToken).mockResolvedValue(null);

      await expect(authService.resetPassword({ token: 'invalid', password: 'NewPass123!' }))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('changePassword', () => {
    it('should change password with valid current password', async () => {
      vi.mocked(authRepository.findUserById).mockResolvedValue({
        id: 'user-1',
        email: 'john@test.com',
        firstName: 'John',
        passwordHash: 'old-hash',
      } as any);
      vi.mocked(passwordUtils.comparePassword).mockResolvedValue(true);
      vi.mocked(passwordUtils.hashPassword).mockResolvedValue('new-hash');

      const result = await authService.changePassword('user-1', {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
      });

      expect(result.message).toBe('Password changed successfully');
    });

    it('should throw UnauthorizedError for wrong current password', async () => {
      vi.mocked(authRepository.findUserById).mockResolvedValue({
        id: 'user-1',
        passwordHash: 'old-hash',
      } as any);
      vi.mocked(passwordUtils.comparePassword).mockResolvedValue(false);

      await expect(authService.changePassword('user-1', {
        currentPassword: 'WrongPass123!',
        newPassword: 'NewPass123!',
      })).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      vi.mocked(authRepository.findUserByVerificationToken).mockResolvedValue({
        id: 'user-1',
        email: 'john@test.com',
      } as any);

      const result = await authService.verifyEmail({ token: 'valid-token' });

      expect(result.message).toBe('Email verified successfully');
      expect(authRepository.verifyEmail).toHaveBeenCalledWith('user-1');
    });

    it('should throw BadRequestError for invalid token', async () => {
      vi.mocked(authRepository.findUserByVerificationToken).mockResolvedValue(null);

      await expect(authService.verifyEmail({ token: 'invalid' }))
        .rejects.toThrow(BadRequestError);
    });
  });
});
