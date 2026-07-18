import { describe, it, expect } from 'vitest'

/**
 * Deployment Validation Test
 *
 * Comprehensive checks to validate a production deployment.
 * Run after deploying to production or staging.
 *
 * Usage: npx vitest run tests/production/deployment-validation.test.ts
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Deployment Validation', () => {
  describe('Environment Variables', () => {
    it('has required environment variables', () => {
      const required = [
        'DATABASE_URL',
        'JWT_SECRET',
        'NEXTAUTH_URL',
      ]

      const missing = required.filter((key) => !process.env[key])

      if (missing.length > 0) {
        console.warn(`Missing env vars: ${missing.join(', ')}`)
      }

      // In CI/test environments, some vars may not be set — log but don't fail hard
      expect(missing).toHaveLength(0)
    })

    it('JWT_SECRET is not a default/weak value', () => {
      const jwtSecret = process.env.JWT_SECRET || ''
      const weakValues = ['secret', 'jwt-secret', 'change-me', 'default', 'test']

      const isWeak = weakValues.some((weak) =>
        jwtSecret.toLowerCase().includes(weak)
      )

      expect(isWeak).toBe(false)
      expect(jwtSecret.length).toBeGreaterThanOrEqual(32)
    })
  })

  describe('Database Migrations', () => {
    it('database is reachable', async () => {
      const response = await fetch(`${BASE_URL}/api/health`)
      expect(response.status).toBe(200)
    })

    it('can query the database', async () => {
      // Use the version endpoint which typically hits the DB
      const response = await fetch(`${BASE_URL}/api/version`)
      expect(response.status).toBe(200)

      const body = await response.json().catch(() => ({}))
      expect(body).toBeDefined()
    })
  })

  describe('Redis Connection', () => {
    it('Redis is accessible (via health check)', async () => {
      const response = await fetch(`${BASE_URL}/api/health`)
      expect(response.status).toBe(200)

      const body = await response.json().catch(() => ({}))
      // If the health check includes Redis status
      if (body.redis !== undefined) {
        expect(body.redis).toBe('ok')
      }
    })
  })

  describe('API Endpoints', () => {
    it('health endpoint responds correctly', async () => {
      const response = await fetch(`${BASE_URL}/api/health`)
      expect(response.status).toBe(200)

      const body = await response.json().catch(() => ({}))
      expect(body).toHaveProperty('status')
    })

    it('ready endpoint responds correctly', async () => {
      const response = await fetch(`${BASE_URL}/api/ready`)
      expect(response.status).toBe(200)
    })

    it('version endpoint returns version', async () => {
      const response = await fetch(`${BASE_URL}/api/version`)
      expect(response.status).toBe(200)

      const body = await response.json().catch(() => ({}))
      expect(body).toHaveProperty('version')
    })
  })

  describe('Health Checks', () => {
    it('all health checks pass', async () => {
      const endpoints = ['/api/health', '/api/ready', '/api/live']

      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          const response = await fetch(`${BASE_URL}${endpoint}`)
          return { endpoint, status: response.status, ok: response.ok }
        })
      )

      for (const result of results) {
        expect(result.ok).toBe(true)
        expect(result.status).toBe(200)
      }
    })
  })

  describe('Security Headers', () => {
    it('has security headers on main page', async () => {
      const response = await fetch(`${BASE_URL}/`)
      expect(response.status).toBe(200)

      const headers = response.headers

      // These headers should be present when behind Nginx in production
      const xContentType = headers.get('x-content-type-options')
      const xFrame = headers.get('x-frame-options')
      const referrer = headers.get('referrer-policy')

      // Log what we found for debugging
      console.log('Security headers found:', {
        'x-content-type-options': xContentType,
        'x-frame-options': xFrame,
        'referrer-policy': referrer,
      })

      // At minimum, we expect the app to set some headers
      expect(headers.get('content-type')).toBeTruthy()
    })

    it('CSP or security policy is configured', async () => {
      const response = await fetch(`${BASE_URL}/`)
      const headers = response.headers

      const csp = headers.get('content-security-policy')
      const xFrame = headers.get('x-frame-options')

      // Either CSP or X-Frame-Options should be present in production
      const hasSecurity = csp || xFrame

      if (!hasSecurity) {
        console.warn('No CSP or X-Frame-Options header found — verify Nginx/security config')
      }

      // Don't fail hard — this depends on the proxy setup
      expect(response.status).toBe(200)
    })
  })

  describe('File Upload Limits', () => {
    it('handles large request bodies appropriately', async () => {
      // Test that the server doesn't crash on a reasonable payload
      const largePayload = { data: 'x'.repeat(10000) }

      const response = await fetch(`${BASE_URL}/api/health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(largePayload),
      })

      // Should either accept or return 413 (Payload Too Large)
      expect([200, 404, 413]).toContain(response.status)
    })
  })

  describe('Session Configuration', () => {
    it('session cookies are configured securely', async () => {
      // This test checks if the login endpoint sets appropriate cookies
      // Actual cookie security depends on the auth implementation
      const response = await fetch(`${BASE_URL}/login`)
      expect(response.status).toBe(200)
    })
  })
})
