# Phase 4: Company & User Management Module

## Overview

The Company & User Management module provides complete multi-tenant administration for fleet management companies. Each company can manage its own users, branches, departments, roles, and settings with strict data isolation.

## Folder Structure

```
src/
├── modules/
│   ├── auth/                    # Phase 3 - Authentication (reused)
│   ├── company/
│   │   ├── controllers/
│   │   │   └── company.controller.ts
│   │   ├── services/
│   │   │   └── company.service.ts
│   │   ├── repositories/
│   │   │   └── company.repository.ts
│   │   ├── validators/
│   │   │   └── company.validator.ts
│   │   └── __tests__/
│   │       └── company.service.test.ts
│   ├── branch/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── validators/
│   ├── department/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── validators/
│   ├── user/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── validators/
│   ├── role/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── validators/
│   └── invitation/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       └── validators/
├── app/
│   ├── api/
│   │   ├── company/
│   │   │   ├── route.ts
│   │   │   └── settings/
│   │   │       └── route.ts
│   │   ├── branches/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── departments/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── users/
│   │   │   ├── route.ts
│   │   │   ├── invite/
│   │   │   │   └── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── suspend/
│   │   │       │   └── route.ts
│   │   │       └── activate/
│   │   │           └── route.ts
│   │   ├── roles/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── clone/
│   │   │           └── route.ts
│   │   ├── permissions/
│   │   │   └── route.ts
│   │   └── invitations/
│   │       ├── route.ts
│   │       ├── accept/
│   │       │   └── route.ts
│   │       └── [id]/
│   │           └── route.ts
│   └── dashboard/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── company/
│       │   └── page.tsx
│       ├── branches/
│       │   └── page.tsx
│       ├── departments/
│       │   └── page.tsx
│       ├── users/
│       │   └── page.tsx
│       ├── roles/
│       │   └── page.tsx
│       ├── invitations/
│       │   └── page.tsx
│       └── settings/
│           └── page.tsx
```

## API Endpoints

### Company
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | /api/company | Get company profile | Authenticated |
| PUT | /api/company | Update company profile | company:update |
| GET | /api/company/settings | Get company settings | company:read |
| PUT | /api/company/settings | Update company settings | company:update |

### Branches
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | /api/branches | List all branches | company:read |
| POST | /api/branches | Create branch | company:update |
| GET | /api/branches/:id | Get branch | company:read |
| PUT | /api/branches/:id | Update branch | company:update |
| DELETE | /api/branches/:id | Delete branch | company:update |

### Departments
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | /api/departments | List all departments | company:read |
| POST | /api/departments | Create department | company:update |
| GET | /api/departments/:id | Get department | company:read |
| PUT | /api/departments/:id | Update department | company:update |
| DELETE | /api/departments/:id | Delete department | company:update |

### Users
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | /api/users | List all users | users:read |
| POST | /api/users | Create user | users:create |
| GET | /api/users/:id | Get user | users:read |
| PUT | /api/users/:id | Update user | users:update |
| DELETE | /api/users/:id | Delete user | users:delete |
| POST | /api/users/invite | Invite user | users:create |
| POST | /api/users/:id/suspend | Suspend user | users:update |
| POST | /api/users/:id/activate | Activate user | users:update |

### Roles
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | /api/roles | List all roles | roles:manage |
| POST | /api/roles | Create role | roles:manage |
| GET | /api/roles/:id | Get role | roles:manage |
| PUT | /api/roles/:id | Update role | roles:manage |
| DELETE | /api/roles/:id | Delete role | roles:manage |
| POST | /api/roles/:id/clone | Clone role | roles:manage |
| GET | /api/permissions | List all permissions | roles:manage |

### Invitations
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | /api/invitations | List invitations | users:create |
| POST | /api/invitations | Create invitation | users:create |
| POST | /api/invitations/accept | Accept invitation | Public |
| DELETE | /api/invitations/:id | Cancel invitation | users:create |
| POST | /api/invitations/:id | Resend invitation | users:create |

## Sequence Diagrams

### User Invitation Flow
```
User (Admin)          API                   Service                Repository               Email
    |                  |                       |                       |                       |
    |--- POST /api/invitations ------------->|                       |                       |
    |                  |--- createInvitation ->|                       |                       |
    |                  |                      |--- create() --------->|                       |
    |                  |                      |<-- invitation --------|                       |
    |                  |                      |--- addRoles() ------->|                       |
    |                  |                      |--- sendEmail() -------------------------------->|
    |                  |                      |<-- sent -------------|                       |
    |                  |<-- 201 Created ------|                       |                       |
    |<-- Invitation sent                     |                       |                       |
    |                  |                       |                       |                       |
    |                                          |                       |                       |
Invited User         API                   Service                Repository
    |                  |                       |                       |
    |--- POST /api/invitations/accept ------>|                       |
    |                  |--- acceptInvitation ->|                       |
    |                  |                      |--- findByToken() ---->|
    |                  |                      |<-- invitation --------|
    |                  |                      |--- createUser() ----->|
    |                  |                      |<-- user --------------|
    |                  |                      |--- createUserRoles() >|
    |                  |                      |--- accept() -------->|
    |                  |<-- 200 Success ------|                       |
    |<-- Account created                     |                       |
```

### Permission Check Flow
```
Request              withAuth             requirePermission           Controller
  |                      |                      |                        |
  |--- API Request ---->|                      |                        |
  |                      |--- Verify JWT ------>|                        |
  |                      |<-- Valid token ------|                        |
  |                      |--- Check permission ->|                       |
  |                      |                      |--- Load user roles --->|
  |                      |                      |<-- roles -------------|
  |                      |                      |--- Check permission   |
  |                      |<-- Allowed ---------|                        |
  |                      |--- Call handler ---------------------------->|
  |                      |<-- Response --------|                        |
  |<--- API Response ---|                      |                        |
```

## Tenant Isolation Strategy

1. **JWT Token**: Contains `companyId` claim
2. **Auth Middleware**: Validates token, sets `x-user-id` and `x-company-id` headers
3. **RBAC Middleware**: Checks user permissions for the company
4. **Repository Layer**: Every query includes `companyId` filter
5. **Soft Deletes**: `deletedAt: null` ensures deleted records are hidden

## System Roles

| Role | Permissions |
|------|------------|
| Company Owner | Full access to all permissions |
| Fleet Manager | vehicles, drivers, trips, maintenance |
| Dispatcher | trips, routes, drivers (read) |
| Accountant | invoices, expenses, reports |
| Driver | trips (own), fuel (own) |
| Viewer | Read-only access |

## Security Features

- ✅ Tenant isolation via companyId
- ✅ RBAC with database-driven permissions
- ✅ Soft deletes for users, branches, departments, roles
- ✅ Audit logging for all mutations
- ✅ Input validation with Zod
- ✅ Rate limiting (inherited from Phase 3)
- ✅ JWT authentication (inherited from Phase 3)
