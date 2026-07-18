import { UserStatus, CompanyStatus } from '@prisma/client';

export interface TokenPayload {
  sub: string;        // userId
  cid: string;        // companyId
  email: string;
  roles: string[];    // roleIds
  permissions: string[];
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserWithCompany {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  passwordHash: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  companyUsers: {
    companyId: string;
    isOwner: boolean;
    company: {
      id: string;
      name: string;
      slug: string;
      status: CompanyStatus;
    };
  }[];
  userRoles: {
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
  }[];
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  roles: string[];
  permissions: string[];
  isOwner: boolean;
}

export interface SessionData {
  id: string;
  userId: string;
  companyId: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
}

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export interface EmailContext {
  to: string;
  firstName: string;
  companyName?: string;
  token?: string;
  loginTime?: string;
  ipAddress?: string;
}
