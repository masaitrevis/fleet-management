# Authentication & Authorization Module Documentation

## Module Overview

The Authentication & Authorization module provides complete identity management, access control, and security features for the Fleet Management SaaS. It follows Clean Architecture principles with clear separation between Controllers, Services, and Repositories.

---

## Folder Structure

```
src/modules/auth/
├── controllers/
│   └── auth.controller.ts      # HTTP request handlers
├── services/
│   └── auth.service.ts         # Business logic layer
├── repositories/
│   └── auth.repository.ts      # Database access layer
├── validators/
│   └── auth.validator.ts       # Zod input validation schemas
├── middleware/
│   ├── auth.middleware.ts      # JWT verification
│   ├── rbac.middleware.ts      # Role & permission checks
│   ├── tenant.middleware.ts    # Company context validation
│   └── rateLimit.middleware.ts # Rate limiting
├── types/
│   └── auth.types.ts           # TypeScript interfaces
└── utils/
    ├── jwt.ts                  # JWT token generation/verification
    ├── password.ts             # bcrypt password hashing
    ├── crypto.ts               # Secure token generation
    └── email.ts                # Email template service

src/app/api/auth/               # Next.js API Routes
├── register-company/route.ts   # POST - Company registration
├── register/route.ts           # POST - User registration
├── login/route.ts              # POST - User login
├── logout/route.ts             # POST - User logout
├── refresh/route.ts            # POST - Token refresh
├── forgot-password/route.ts    # POST - Password reset request
├── reset-password/route.ts     # POST - Password reset confirm
├── change-password/route.ts    # POST - Change password (authenticated)
├── verify-email/route.ts       # POST - Email verification
├── resend-verification/route.ts # POST - Resend verification email
└── me/route.ts                 # GET - Current user profile
```

---

## API Endpoints

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/auth/register-company` | Register new company with owner | 5/min |
| POST | `/api/auth/register` | Register new user in company | 5/min |
| POST | `/api/auth/login` | User login | 5/min |
| POST | `/api/auth/refresh` | Refresh access token | 5/min |
| POST | `/api/auth/forgot-password` | Request password reset | 3/hour |
| POST | `/api/auth/reset-password` | Confirm password reset | - |
| POST | `/api/auth/verify-email` | Verify email address | - |
| POST | `/api/auth/resend-verification` | Resend verification email | 5/min |

### Protected Endpoints (Authentication Required)

| Method | Endpoint | Description | Required Permission |
|--------|----------|-------------|-------------------|
| GET | `/api/auth/me` | Get current user profile | - |
| POST | `/api/auth/change-password` | Change password | - |
| POST | `/api/auth/logout` | Logout user | - |

---

## Authentication Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  API Route  │────▶│ Controller  │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Service   │
                                        └─────────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          ▼                    ▼                    ▼
                   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                   │  Repository │     │  JWT Utils  │     │  Email Utils│
                   └─────────────┘     └─────────────┘     └─────────────┘
                          │                    │                    │
                          ▼                    ▼                    ▼
                   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                   │   Prisma    │     │  JWT Sign   │     │   Resend    │
                   │   (DB)      │     │  /Verify    │     │   (SMTP)    │
                   └─────────────┘     └─────────────┘     └─────────────┘
```

### Registration Flow

```
Client                    API                      Service                    Repository
  │                        │                          │                          │
  │ POST /register-company │                          │                          │
  │───────────────────────▶│                          │                          │
  │                        │ validate input (Zod)     │                          │
  │                        │─────────────────────────▶│                          │
  │                        │                          │ check slug uniqueness    │
  │                        │                          │─────────────────────────▶│
  │                        │                          │                          │
  │                        │                          │ create company + user    │
  │                        │                          │ (transaction)            │
  │                        │                          │─────────────────────────▶│
  │                        │                          │                          │
  │                        │                          │ generate verify token    │
  │                        │                          │ send welcome email       │
  │                        │                          │─────────────────────────▶│
  │                        │                          │                          │
  │ 201 Created            │                          │                          │
  │◀───────────────────────│                          │                          │
  │                        │                          │                          │
```

### Login Flow

```
Client                    API                      Service                    Repository
  │                        │                          │                          │
  │ POST /login            │                          │                          │
  │ {email, password}      │                          │                          │
  │───────────────────────▶│                          │                          │
  │                        │ validate input (Zod)     │                          │
  │                        │─────────────────────────▶│                          │
  │                        │                          │ find user by email       │
  │                        │                          │─────────────────────────▶│
  │                        │                          │                          │
  │                        │                          │ verify password (bcrypt) │
  │                        │                          │ check account lock       │
  │                        │                          │ check email verified     │
  │                        │                          │                          │
  │                        │                          │ generate JWT tokens      │
  │                        │                          │ create session (DB)      │
  │                        │                          │ update last login        │
  │                        │                          │─────────────────────────▶│
  │                        │                          │                          │
  │                        │                          │ send new-login alert     │
  │                        │                          │ audit log                │
  │                        │                          │                          │
  │ 200 OK                 │                          │                          │
  │ {accessToken, user}    │                          │                          │
  │ Set-Cookie: refreshToken│                         │                          │
  │◀───────────────────────│                          │                          │
  │                        │                          │                          │
```

---

## JWT Lifecycle

### Access Token

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACCESS TOKEN LIFECYCLE                        │
└─────────────────────────────────────────────────────────────────┘

  Generation                                    Verification
  ┌─────────┐                                  ┌─────────┐
  │  Login  │────▶ Sign JWT (HS256) ────▶     │  API    │────▶ Verify JWT
  │ Service │      Payload: {sub, cid,        │ Request │      Check expiry
  │         │             email, roles,       │         │      Extract user
  │         │             permissions}        │         │
  └─────────┘      Expiry: 15 minutes        └─────────┘
       │                                          │
       ▼                                          ▼
  ┌─────────┐                              ┌─────────────┐
  │ Client  │◀──── Authorization: Bearer ──│ Middleware  │
  │ Storage │      {accessToken}           │ (auth)      │
  └─────────┘                              └─────────────┘

  Refresh Flow
  ┌─────────┐
  │  401    │────▶ POST /api/auth/refresh
  │ Expired │      (httpOnly cookie: refreshToken)
  └─────────┘
       │
       ▼
  ┌─────────────┐
  │ Verify      │
  │ refresh     │
  │ token       │
  └─────────────┘
       │
       ▼
  ┌─────────────┐
  │ Revoke old  │
  │ session     │
  │ Generate    │
  │ new tokens  │
  └─────────────┘
       │
       ▼
  ┌─────────────┐
  │ Return new  │
  │ accessToken │
  │ Set new     │
  │ refreshToken│
  │ cookie      │
  └─────────────┘
```

### Token Payload Structure

```typescript
interface TokenPayload {
  sub: string;           // User ID (UUID)
  cid: string;           // Company ID (UUID)
  email: string;         // User email
  roles: string[];       // Array of role IDs
  permissions: string[]; // Array of permission strings
  type: 'access' | 'refresh';
  iat: number;           // Issued at (epoch)
  exp: number;           // Expires at (epoch)
}
```

---

## Refresh Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                  REFRESH TOKEN LIFECYCLE                             │
└─────────────────────────────────────────────────────────────────────┘

  Login
    │
    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Generate   │───▶│   Hash with  │───▶│  Store in    │
│   Refresh    │    │   SHA256     │    │  Session DB  │
│   Token      │    │              │    │  (tokenHash) │
└──────────────┘    └──────────────┘    └──────────────┘
    │                                        │
    ▼                                        ▼
┌──────────────┐                      ┌──────────────┐
│ Set httpOnly │                      │ Expiry: 7    │
│ Secure Cookie│                      │ days         │
│ SameSite     │                      │              │
└──────────────┘                      └──────────────┘

  Refresh Request
    │
    ▼
┌──────────────┐
│ Read cookie  │
│ refreshToken │
└──────────────┘
    │
    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Hash token   │───▶│ Find session │───▶│ Check not    │
│ with SHA256  │    │ in DB        │    │ revoked      │
└──────────────┘    └──────────────┘    └──────────────┘
    │                                        │
    ▼                                        ▼
┌──────────────┐                      ┌──────────────┐
│ Verify JWT   │                      │ Check expiry │
│ signature    │                      │ > now        │
└──────────────┘                      └──────────────┘
    │
    ▼
┌──────────────┐
│ Revoke old   │
│ session      │
│ Generate new │
│ token pair   │
└──────────────┘
    │
    ▼
┌──────────────┐
│ Return new   │
│ accessToken  │
│ Set new      │
│ refreshToken │
│ cookie       │
└──────────────┘
```

---

## Security Architecture

### Defense Layers

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: HTTPS / TLS 1.3                                   │
│  - All traffic encrypted in transit                         │
│  - HSTS headers enabled                                     │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: Rate Limiting                                     │
│  - Auth endpoints: 5 req/min                                │
│  - Password reset: 3 req/hour                               │
│  - IP-based tracking                                        │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: Input Validation (Zod)                            │
│  - Strict schema validation                                 │
│  - SQL injection prevention (Prisma ORM)                    │
│  - XSS protection (output encoding)                         │
├─────────────────────────────────────────────────────────────┤
│  LAYER 4: Authentication                                    │
│  - bcrypt password hashing (12 rounds)                      │
│  - JWT access tokens (15 min)                               │
│  - JWT refresh tokens (7 days, httpOnly cookie)             │
│  - Account lockout (5 failed attempts)                      │
│  - Email verification required                              │
├─────────────────────────────────────────────────────────────┤
│  LAYER 5: Authorization                                     │
│  - RBAC with database-driven permissions                    │
│  - Role-based access control                                │
│  - Permission-based fine-grained access                     │
│  - Tenant isolation (companyId)                             │
├─────────────────────────────────────────────────────────────┤
│  LAYER 6: Audit & Logging                                   │
│  - Audit log for all auth events                            │
│  - IP address and user agent tracking                       │
│  - Session management                                       │
└─────────────────────────────────────────────────────────────┘
```

### Password Security

- **Hashing**: bcrypt with 12 salt rounds
- **Strength Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Account Lockout**: 5 failed attempts → 15-minute lockout
- **Password Reset**: 1-hour expiry token, SHA256 hashed in DB
- **Change Password**: Revokes all existing sessions

### Token Security

| Token Type | Storage | Expiry | Transport |
|-----------|---------|--------|-----------|
| Access Token | Client memory (React state) | 15 minutes | Authorization header |
| Refresh Token | httpOnly, Secure, SameSite=Strict cookie | 7 days | Automatic (cookie) |

### CSRF Protection

- Refresh tokens are httpOnly cookies (not accessible to JavaScript)
- SameSite=Strict prevents cross-site request forgery
- No sensitive operations via GET requests
- State-changing operations require authentication

### Session Management

- All refresh tokens stored in database with SHA256 hash
- Tokens can be revoked (logout)
- All user sessions can be revoked (password change, security breach)
- Expired sessions automatically cleaned up
- Sessions track IP address and user agent

---

## RBAC (Role-Based Access Control)

### Default Roles

| Role | Key Permissions | Description |
|------|----------------|-------------|
| Super Admin | `*` (all) | Platform administrator |
| Company Owner | `company:*`, `user:*`, `vehicle:*`, `driver:*`, `trip:*`, `route:*`, `maintenance:*`, `fuel:*`, `expense:*`, `invoice:*`, `report:read`, `settings:*` | Full company access |
| Fleet Manager | `vehicle:*`, `driver:*`, `trip:*`, `route:*`, `maintenance:*`, `fuel:*`, `report:read` | Manages fleet operations |
| Dispatcher | `trip:*`, `route:*`, `driver:read`, `vehicle:read` | Manages trips and routes |
| Driver | `trip:read` (assigned), `vehicle:read` (assigned) | Limited to own assignments |
| Accountant | `expense:*`, `invoice:*`, `payment:*`, `report:read` | Financial management |
| Viewer | `*:read` (company data) | Read-only access |

### Permission Format

Permissions follow the pattern: `resource:action`

```
Examples:
  company:read      - View company details
  company:update    - Update company settings
  vehicle:create    - Add new vehicles
  vehicle:delete    - Remove vehicles
  trip:read         - View trips
  trip:update       - Update trip status
  report:read       - View reports
  settings:update   - Change system settings
```

### Checking Permissions

```typescript
// In middleware
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('vehicle:create')(
    async (req) => {
      // Only users with vehicle:create permission can access
    }
  )
);

// In service
const hasPermission = user.permissions.includes('vehicle:delete');
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid email or password"
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `BAD_REQUEST` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Authentication required or failed |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fleet_db"

# JWT Secrets (generate strong random strings)
JWT_SECRET="your-256-bit-secret-key-here"
JWT_REFRESH_SECRET="your-different-256-bit-secret-key-here"
JWT_EXPIRES_IN=900           # 15 minutes
JWT_REFRESH_EXPIRES_IN=604800 # 7 days

# Email
RESEND_API_KEY="re_xxxxxxxx"
FROM_EMAIL="noreply@yourdomain.com"

# App
APP_URL="https://yourdomain.com"
NODE_ENV="production"
```

---

## Testing

### Running Tests

```bash
# Unit tests
npm test -- auth

# Integration tests
npm run test:integration -- auth

# Coverage
npm run test:coverage
```

### Test Categories

1. **Unit Tests**: Services, utilities, validators
2. **Integration Tests**: Full API request/response cycles
3. **Authentication Flow Tests**: Registration → Verification → Login → Logout

---

## Integration Notes

### Frontend Integration

```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const { data } = await response.json();
// Store access token in memory (not localStorage for security)
// Refresh token is automatically set as httpOnly cookie

// API Calls
const apiCall = await fetch('/api/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

// Logout
await fetch('/api/auth/logout', { method: 'POST' });
// Cookie is automatically cleared
```

### Mobile/Driver App Integration

For mobile apps, the refresh token should be stored in the device's secure storage (Keychain on iOS, Keystore on Android) instead of cookies.

---

## Audit Events

All authentication events are logged to the `AuditLog` table:

| Event | Description |
|-------|-------------|
| `COMPANY_REGISTERED` | New company and owner registered |
| `USER_LOGIN` | User logged in |
| `USER_LOGOUT` | User logged out |
| `USER_LOGOUT_ALL` | User logged out from all devices |
| `PASSWORD_RESET_REQUESTED` | Password reset email sent |
| `PASSWORD_RESET` | Password was reset |
| `PASSWORD_CHANGED` | User changed password |
| `EMAIL_VERIFIED` | Email address verified |
