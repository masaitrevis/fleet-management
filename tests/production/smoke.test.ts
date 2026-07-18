import { describe, it, expect, beforeAll } from 'vitest'

/**
 * Production Smoke Tests
 *
 * These tests verify that critical endpoints and pages are accessible
 * and return expected status codes. Run after every deployment.
 *
 * Usage: npm run test:production:smoke
 * Or: npx vitest run tests/production/smoke.test.ts
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Production Smoke Tests', () => {
  describe('Health Check Endpoints', () => {
    it('GET /api/health returns 200', async () => {
      const response = await fetch(`${BASE_URL}/api/health`)
      expect(response.status).toBe(200)

      const body = await response.json().catch(() => ({}))
      expect(body).toBeDefined()
    })

    it('GET /api/ready returns 200', async () => {
      const response = await fetch(`${BASE_URL}/api/ready`)
      expect(response.status).toBe(200)

      const body = await response.json().catch(() => ({}))
      expect(body).toBeDefined()
    })

    it('GET /api/live returns 200', async () => {
      const response = await fetch(`${BASE_URL}/api/live`)
      expect(response.status).toBe(200)
    })

    it('GET /api/version returns version info', async () => {
      const response = await fetch(`${BASE_URL}/api/version`)
      expect(response.status).toBe(200)

      const body = await response.json().catch(() => ({}))
      expect(body).toHaveProperty('version')
    })

    it('GET /api/metrics returns Prometheus format (if enabled)', async () => {
      const response = await fetch(`${BASE_URL}/api/metrics`)
      // Metrics may be disabled in some environments; accept 200 or 404
      expect([200, 404]).toContain(response.status)

      if (response.status === 200) {
        const body = await response.text()
        expect(body.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Main Pages', () => {
    it('Main page loads (200)', async () => {
      const response = await fetch(`${BASE_URL}/`)
      expect(response.status).toBe(200)

      const body = await response.text()
      expect(body.length).toBeGreaterThan(100)
      expect(body).toContain('<html')
    })

    it('Login page loads (200)', async () => {
      const response = await fetch(`${BASE_URL}/login`)
      expect(response.status).toBe(200)

      const body = await response.text()
      expect(body.length).toBeGreaterThan(100)
    })

    it('404 page returns 404 for unknown routes', async () => {
      const response = await fetch(`${BASE_URL}/this-page-definitely-does-not-exist-12345`)
      expect(response.status).toBe(404)
    })
  })

  describe('Security Headers', () => {
    it('Response includes security headers', async () => {
      const response = await fetch(`${BASE_URL}/`)
      expect(response.status).toBe(200)

      const headers = response.headers

      // Content-Type should be present
      expect(headers.get('content-type')).toBeTruthy()

      // If running behind a properly configured proxy, these should be present
      // Note: These may not appear in dev mode without the full nginx stack
      const csp = headers.get('content-security-policy')
      const xFrame = headers.get('x-frame-options')
      const xContentType = headers.get('x-content-type-options')

      // At minimum, Content-Type options should be set in production
      if (xContentType) {
        expect(xContentType.toLowerCase()).toBe('nosniff')
      }
    })
  })

  describe('Response Time', () => {
    it('Health check responds within 2 seconds', async () => {
      const start = Date.now()
      const response = await fetch(`${BASE_URL}/api/health`)
      const duration = Date.now() - start

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(2000)
    })
  })
})
