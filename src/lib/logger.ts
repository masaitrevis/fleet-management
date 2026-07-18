/**
 * Structured JSON logger.
 * Singleton. Supports context propagation and child loggers.
 * Environment-aware: debug in dev, info in production.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  traceId?: string;
  tenantId?: string;
  userId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  traceId?: string;
  tenantId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

function getMinLevel(): LogLevel {
  const env = process.env.LOG_LEVEL || process.env.NODE_ENV;
  if (env === 'debug' || env === 'development') return 'debug';
  if (env === 'test') return 'warn';
  return 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[getMinLevel()];
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

class Logger {
  private context: LogContext = {};
  private service = 'fleet-management';

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      traceId: this.context.traceId,
      tenantId: this.context.tenantId,
      userId: this.context.userId,
      metadata: metadata
        ? {
            ...this.context,
            ...metadata,
            traceId: undefined,
            tenantId: undefined,
            userId: undefined,
          }
        : undefined,
    };

    // Clean undefineds from metadata
    if (entry.metadata) {
      for (const key of Object.keys(entry.metadata)) {
        if (entry.metadata[key] === undefined) {
          delete entry.metadata[key];
        }
      }
    }

    const line = formatLog(entry);

    switch (level) {
      case 'debug':
        console.debug(line);
        break;
      case 'info':
        console.info(line);
        break;
      case 'warn':
        console.warn(line);
        break;
      case 'error':
      case 'fatal':
        console.error(line);
        break;
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata);
  }

  fatal(message: string, metadata?: Record<string, unknown>): void {
    this.log('fatal', message, metadata);
  }

  withContext(ctx: LogContext): Logger {
    const child = new Logger();
    child.context = { ...this.context, ...ctx };
    child.service = this.service;
    return child;
  }

  setService(name: string): void {
    this.service = name;
  }
}

let globalLogger: Logger | null = null;

export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger();
  }
  return globalLogger;
}

export { Logger };
