# Security Hardening Guide

## Authentication

### JWT Configuration
- **Secret**: Minimum 256 bits (32 bytes). Generate with:
  ```bash
  openssl rand -base64 32
  ```
- **Rotation**: Rotate quarterly or after any suspected compromise
- **Algorithm**: Use `HS256` for symmetric signing, `RS256` for asymmetric
- **Expiry**: Access tokens — 15 minutes; Refresh tokens — 7 days
- **Storage**: Never store JWT secrets in code or repositories

### Password Policy
- **Minimum length**: 12 characters
- **Complexity**: At least one uppercase, lowercase, number, special character
- **Hashing**: bcrypt with cost factor ≥ 12
- **Reuse prevention**: Prevent last 5 passwords
- **Lockout**: 5 failed attempts → 15-minute lockout

### Multi-Factor Authentication (MFA)
- **TOTP-based** (Time-based One-Time Password)
- Recommended for all admin and platform-admin accounts
- Future implementation: SMS backup codes

### Session Management
- **Backend**: Redis-backed sessions with 24-hour expiry
- **Cookies**: `HttpOnly`, `Secure`, `SameSite=strict`
- **Logout**: Invalidate session in Redis immediately
- **Concurrent sessions**: Limit to 3 per user

---

## Authorization

### Role-Based Access Control (RBAC)
The system implements granular RBAC with the following roles:

| Role | Scope | Permissions |
|------|-------|-------------|
| `SUPER_ADMIN` | Platform | Full system access |
| `ADMIN` | Company | Manage company resources |
| `MANAGER` | Company | Read + limited write |
| `DRIVER` | Self | Own data only |
| `VIEWER` | Company | Read-only access |

### Tenant Isolation
Every database query **must** include the `companyId` filter:

```typescript
// ✅ Correct — enforces tenant isolation
const vehicles = await prisma.vehicle.findMany({
  where: { companyId: context.companyId }
})

// ❌ WRONG — returns all tenants' data
const vehicles = await prisma.vehicle.findMany()
```

### Middleware Enforcement
All API routes protected by middleware:

```typescript
// Every route checks authentication AND authorization
export async function middleware(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return new Response('Unauthorized', { status: 401 })
  
  const hasPermission = await checkPermission(session, requiredPermission)
  if (!hasPermission) return new Response('Forbidden', { status: 403 })
}
```

---

## Input Validation

### Zod Schemas
All inputs validated with strict Zod schemas:

```typescript
import { z } from 'zod'

const createVehicleSchema = z.object({
  registrationNumber: z.string().min(3).max(20),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  companyId: z.string().uuid(),
})

// Strict mode — rejects unknown keys
const result = createVehicleSchema.strict().parse(input)
```

### File Uploads
- **Type validation**: Whitelist MIME types (image/jpeg, image/png, application/pdf)
- **Size limits**: Max 10MB per file, 50MB per upload batch
- **Extension check**: Verify extension matches MIME type
- **Virus scanning**: Integrate ClamAV or cloud scanning service
- **Storage**: Never execute uploaded files; store in S3 with non-executable permissions

### SQL Injection Prevention
- **Prisma ORM** used exclusively — no raw SQL with user input
- If raw queries needed, use parameterized queries:
  ```typescript
  // ✅ Safe — parameterized
  await prisma.$queryRaw`SELECT * FROM "Vehicle" WHERE id = ${vehicleId}`
  
  // ❌ DANGEROUS — string concatenation
  await prisma.$queryRaw(`SELECT * FROM "Vehicle" WHERE id = ${vehicleId}`)
  ```

### XSS Prevention
- **Output encoding**: All user-generated content escaped before rendering
- **CSP headers**: Strict Content-Security-Policy configured
- **Sanitization**: Use DOMPurify for rich text content

---

## Infrastructure

### HTTPS & TLS
- **TLS 1.2+** required — TLS 1.0/1.1 disabled
- **HSTS** enabled with `max-age=31536000; includeSubDomains; preload`
- **Certificate**: Auto-renewal via Let's Encrypt or managed certificate

### Security Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' wss:;
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), microphone=(), camera=()
```

### Rate Limiting
Redis-based rate limiting per IP and per user:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/login` | 5 requests | 1 minute |
| `/api/auth/register` | 3 requests | 1 hour |
| `/api/*` (general) | 100 requests | 1 minute |
| `/api/admin/*` | 50 requests | 1 minute |

### DDoS Protection
- **Cloudflare** or **AWS Shield** recommended for production
- Rate limiting at edge (before reaching application)
- Geographic blocking if applicable

### Secrets Management
- **Never** commit secrets to repositories
- Use environment variables for all secrets
- For production: use AWS Secrets Manager, HashiCorp Vault, or similar
- Rotate secrets immediately after any team member departure

---

## Monitoring

### Security Events
All security-relevant events logged to the `SecurityEvent` table:

| Event Type | Logged Data | Alert Threshold |
|-----------|-------------|-----------------|
| Failed login | IP, username, timestamp | 5 in 5 minutes |
| Permission denied | User, resource, action | 10 in 1 hour |
| Password changed | User, timestamp | Always |
| API key created | User, key name | Always |
| Admin action | User, action, target | Always |

### Audit Trail
Every admin action logged to `AuditLog`:
- Who performed the action
- What was changed (before/after)
- When it occurred
- From which IP address

### Dependency Scanning
- **Automated**: Snyk or Dependabot enabled on repository
- **Frequency**: Weekly scans
- **Action required**: Patch critical/high vulnerabilities within 7 days

### Secret Scanning
- **GitHub secret scanning** enabled
- **Pre-commit hooks**: `git-secrets` or `truffleHog`
- Repository access limited to required personnel

---

## Security Checklist

### Pre-Deployment
- [ ] JWT secret is strong and not using default value
- [ ] All environment variables are set (no defaults in production)
- [ ] Rate limiting enabled on all public endpoints
- [ ] Security headers configured in Nginx/Next.js
- [ ] File upload restrictions in place
- [ ] SQL injection tested (no raw queries with user input)
- [ ] XSS tested on all user input fields
- [ ] HTTPS enforced with valid certificate
- [ ] Session cookies configured with Secure and HttpOnly

### Ongoing
- [ ] Monthly dependency audit
- [ ] Quarterly secret rotation
- [ ] Quarterly access review (remove unused accounts)
- [ ] Annual penetration test
- [ ] Security training for team members
