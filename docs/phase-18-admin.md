# Phase 18: System Administration & Platform Management

## Overview
This phase implements the complete platform administration layer for the fleet management SaaS. It provides super admin capabilities for tenant management, platform user administration, security monitoring, system configuration, job queue management, backups, and reporting.

## Folder Structure

```
src/modules/platform-admin/
├── middleware/
│   └── admin-auth.middleware.ts    # SUPER_ADMIN authorization
├── controllers/
│   ├── admin-dashboard.controller.ts
│   ├── tenant.controller.ts
│   ├── platform-user.controller.ts
│   ├── feature-flag.controller.ts
│   ├── system-config.controller.ts
│   ├── job.controller.ts
│   ├── security.controller.ts
│   ├── audit-log.controller.ts
│   ├── backup.controller.ts
│   ├── monitoring.controller.ts
│   └── report.controller.ts
├── services/
│   ├── admin-dashboard.service.ts
│   ├── tenant.service.ts
│   ├── platform-user.service.ts
│   ├── feature-flag.service.ts
│   ├── system-config.service.ts
│   ├── job.service.ts
│   ├── security.service.ts
│   ├── audit-log.service.ts
│   ├── backup.service.ts
│   ├── monitoring.service.ts
│   └── report.service.ts
├── repositories/
│   ├── tenant.repository.ts
│   ├── platform-user.repository.ts
│   ├── feature-flag.repository.ts
│   ├── system-config.repository.ts
│   ├── job.repository.ts
│   ├── security.repository.ts
│   ├── audit-log.repository.ts
│   └── backup.repository.ts
├── providers/
│   ├── monitoring.provider.ts       # Interface + mock
│   ├── backup.provider.ts           # Interface + mock
│   ├── queue.provider.ts            # Interface + mock
│   └── storage.provider.ts          # Interface + mock
├── dto/
│   └── index.ts                     # Zod validation schemas
└── types/
    └── index.ts                     # TypeScript interfaces

src/app/api/admin/                   # 30+ API routes
src/app/admin/                       # 12 frontend pages
src/components/admin/                # Shared admin UI components
```

## API Documentation

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Platform metrics & system health |

### Tenant Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/tenants` | List companies with pagination |
| GET | `/api/admin/tenants/:id` | Single company details |
| PUT | `/api/admin/tenants/:id/suspend` | Suspend company |
| PUT | `/api/admin/tenants/:id/activate` | Activate company |
| DELETE | `/api/admin/tenants/:id/delete` | Soft delete company |
| POST | `/api/admin/tenants/:id/impersonate` | Generate impersonation token |
| GET | `/api/admin/tenants/:id/usage` | Company usage stats |

### Platform Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List admin team |
| POST | `/api/admin/users` | Create platform user |
| GET | `/api/admin/users/:id` | Get user |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |

### Feature Flags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/feature-flags` | List flags |
| POST | `/api/admin/feature-flags` | Create flag |
| PUT | `/api/admin/feature-flags/:id` | Update flag |
| DELETE | `/api/admin/feature-flags/:id` | Delete flag |

### System Config
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/system-config` | Get all config |
| PUT | `/api/admin/system-config` | Update config |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/jobs` | List jobs |
| POST | `/api/admin/jobs/:id` | Retry job |
| DELETE | `/api/admin/jobs/:id` | Cancel job |

### Security
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/security` | Dashboard data |
| GET | `/api/admin/security/events` | List events |
| PUT | `/api/admin/security/events/:id/resolve` | Resolve event |
| POST | `/api/admin/security/ip-block` | Block IP |
| DELETE | `/api/admin/security/ip-block` | Unblock IP |

### Audit Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/audit-logs` | List audit logs |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/sessions` | Active sessions |
| DELETE | `/api/admin/sessions/:id` | Terminate session |

### Backups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/backups` | List backups |
| POST | `/api/admin/backups` | Trigger backup |

### Monitoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/monitoring` | System metrics |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/reports/usage` | Usage report |
| GET | `/api/admin/reports/revenue` | Revenue report |
| GET | `/api/admin/reports/security` | Security report |

## Tenant Management Workflow

1. **Onboarding**: New company signs up → status = TRIAL
2. **Activation**: Admin upgrades to ACTIVE or suspends
3. **Monitoring**: Track usage via `/api/admin/tenants/:id/usage`
4. **Impersonation**: Use token to debug tenant-specific issues
5. **Offboarding**: Soft delete or suspend

## Feature Flag Strategy

- Per-tenant feature toggles using `companyId_featureKey` unique constraint
- Config JSON for feature-specific settings
- Toggle history tracked via `enabledAt`/`disabledAt`

## Security Architecture

- All admin routes protected by `withAdminAuth` middleware
- Requires `PlatformUser` with `SUPER_ADMIN` role or `x-admin-token`
- Security events auto-logged for: failed logins, rate limits, suspicious activity
- Failed login tracking with lockout after threshold
- IP blocking capability

## Monitoring Strategy

- Provider interface pattern enables AWS CloudWatch, Datadog, etc.
- Current mock returns reasonable demo data
- Metrics: CPU, memory, disk, DB connections, API latency
- Auto-refresh every 30s on monitoring page

## Backup Architecture

- Provider interface for S3, DigitalOcean Spaces, etc.
- Tracks backup size, path, provider, status
- Supports manual, scheduled, and auto backup types

## Authorization

All admin endpoints require:
1. Bearer token from a `PlatformUser` with `SUPER_ADMIN` role, OR
2. `x-admin-token` header matching `ADMIN_API_TOKEN` env var
