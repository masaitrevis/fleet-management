export enum PlatformUserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUPPORT = 'SUPPORT',
  SALES = 'SALES',
  FINANCE = 'FINANCE',
  ENGINEER = 'ENGINEER',
}

export enum PlatformUserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  CANCELLED = 'CANCELLED',
}

export enum JobType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  NOTIFICATION = 'NOTIFICATION',
  REPORT = 'REPORT',
  BACKUP = 'BACKUP',
  CLEANUP = 'CLEANUP',
  CUSTOM = 'CUSTOM',
}

export enum SecurityEventType {
  FAILED_LOGIN = 'FAILED_LOGIN',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_VIOLATION = 'RATE_LIMIT_VIOLATION',
  IP_BLOCKED = 'IP_BLOCKED',
  API_KEY_VIOLATION = 'API_KEY_VIOLATION',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  DATA_EXPORT = 'DATA_EXPORT',
  IMPERSONATION = 'IMPERSONATION',
}

export enum SecurityEventSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum BackupStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum BackupType {
  MANUAL = 'MANUAL',
  SCHEDULED = 'SCHEDULED',
  AUTO = 'AUTO',
}

export interface PlatformMetrics {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  suspendedCompanies: number;
  totalUsers: number;
  activeUsers: number;
  onlineUsers: number;
  totalVehicles: number;
  activeTrips: number;
  monthlyRevenue: number;
  apiRequests: number;
  storageUsed: number;
  totalJobs: number;
  failedJobs: number;
  systemHealth: SystemHealth;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  database: 'healthy' | 'degraded' | 'critical';
  api: 'healthy' | 'degraded' | 'critical';
  queue: 'healthy' | 'degraded' | 'critical';
  storage: 'healthy' | 'degraded' | 'critical';
  lastChecked: Date;
}

export interface TenantDetails {
  id: string;
  name: string;
  slug: string;
  email: string;
  status: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  totalUsers: number;
  totalVehicles: number;
  totalDrivers: number;
  subscription: {
    plan: string;
    status: string;
    expiresAt: Date | null;
  } | null;
}

export interface SecurityDashboardData {
  totalEvents: number;
  unresolvedEvents: number;
  criticalEvents: number;
  failedLogins24h: number;
  rateLimitViolations24h: number;
  blockedIPs: number;
  recentEvents: SecurityEventItem[];
}

export interface SecurityEventItem {
  id: string;
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  userId: string | null;
  companyId: string | null;
  ipAddress: string | null;
  details: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface MonitoringData {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  dbConnections: number;
  dbConnectionLimit: number;
  apiResponseTimeAvg: number;
  apiRequestsPerMinute: number;
  errorRate: number;
  uptime: number;
  timestamps: Date[];
}
