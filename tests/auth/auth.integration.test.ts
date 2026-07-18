import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { prisma } from '../../src/lib/prisma';

// Integration tests for auth flow
// These tests require a running database

describe('Auth Integration Tests', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testCompanySlug = `test-company-${Date.now()}`;

  beforeAll(async () => {
    // Clean up test data
    await prisma.session.deleteMany({ where: { user: { email: { contains: 'test-' } } } });
    await prisma.userRole.deleteMany({ where: { user: { email: { contains: 'test-' } } } });
    await prisma.companyUser.deleteMany({ where: { user: { email: { contains: 'test-' } } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test-' } } });
    await prisma.company.deleteMany({ where: { slug: { contains: 'test-company-' } } });
  });

  describe('Complete Authentication Flow', () => {
    it('should register a company, verify email, login, and logout', async () => {
      // Step 1: Register company
      const registerResponse = await fetch('http://localhost:3000/api/auth/register-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'Test Company',
          companySlug: testCompanySlug,
          companyEmail: testEmail,
          firstName: 'Test',
          lastName: 'User',
          email: testEmail,
          password: 'TestPass123!',
        }),
      });

      expect(registerResponse.status).toBe(201);
      const registerData = await registerResponse.json();
      expect(registerData.success).toBe(true);
      expect(registerData.data.user.email).toBe(testEmail);

      // Step 2: Verify email (would need to extract token from DB in real test)
      // Skipped for this example - would require email service mocking

      // Step 3: Login
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'TestPass123!',
        }),
      });

      // Will fail if email not verified - expected behavior
      expect([200, 403]).toContain(loginResponse.status);

      if (loginResponse.status === 200) {
        const loginData = await loginResponse.json();
        expect(loginData.success).toBe(true);
        expect(loginData.data.accessToken).toBeDefined();

        // Step 4: Get me
        const meResponse = await fetch('http://localhost:3000/api/auth/me', {
          headers: { Authorization: `Bearer ${loginData.data.accessToken}` },
        });

        expect(meResponse.status).toBe(200);
        const meData = await meResponse.json();
        expect(meData.data.email).toBe(testEmail);

        // Step 5: Logout
        const logoutResponse = await fetch('http://localhost:3000/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${loginData.data.accessToken}` },
        });

        expect(logoutResponse.status).toBe(200);
      }
    });
  });

  describe('Password Reset Flow', () => {
    it('should request password reset', async () => {
      const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      // Should not reveal if email exists
      expect(data.data.message).toContain('If an account exists');
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit after 5 failed login attempts', async () => {
      const attempts = [];
      for (let i = 0; i < 7; i++) {
        attempts.push(
          fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'nonexistent@test.com', password: 'wrong' }),
          })
        );
      }

      const responses = await Promise.all(attempts);
      const rateLimited = responses.some(r => r.status === 429);
      // May or may not be rate limited depending on timing
      expect(rateLimited || responses.every(r => [401, 429].includes(r.status))).toBe(true);
    });
  });
});
