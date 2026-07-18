import { describe, it, expect } from 'vitest';
import { registerCompanySchema, loginSchema, passwordSchema } from '../../src/modules/auth/validators/auth.validator';

describe('Auth Validators', () => {
  describe('passwordSchema', () => {
    it('should accept valid password', () => {
      const result = passwordSchema.safeParse('StrongPass123!');
      expect(result.success).toBe(true);
    });

    it('should reject password without uppercase', () => {
      const result = passwordSchema.safeParse('strongpass123!');
      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase', () => {
      const result = passwordSchema.safeParse('STRONGPASS123!');
      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const result = passwordSchema.safeParse('StrongPass!!!');
      expect(result.success).toBe(false);
    });

    it('should reject password without special char', () => {
      const result = passwordSchema.safeParse('StrongPass123');
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = passwordSchema.safeParse('Short1!');
      expect(result.success).toBe(false);
    });
  });

  describe('registerCompanySchema', () => {
    it('should accept valid company registration', () => {
      const result = registerCompanySchema.safeParse({
        companyName: 'Test Company',
        companySlug: 'test-company',
        companyEmail: 'company@test.com',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'StrongPass123!',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = registerCompanySchema.safeParse({
        companyName: 'Test Company',
        companySlug: 'test-company',
        companyEmail: 'invalid-email',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'StrongPass123!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid slug', () => {
      const result = registerCompanySchema.safeParse({
        companyName: 'Test Company',
        companySlug: 'Test Company 123', // spaces not allowed
        companyEmail: 'company@test.com',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'StrongPass123!',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login', () => {
      const result = loginSchema.safeParse({
        email: 'john@test.com',
        password: 'anypassword',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid',
        password: 'password',
      });
      expect(result.success).toBe(false);
    });
  });
});
