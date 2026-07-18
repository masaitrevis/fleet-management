import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Public API Service
 * Manages API keys, rate limiting, and webhook delivery for third-party integrations
 */
export class PublicApiService {
  /**
   * Validate API key and return associated company
   */
  async validateApiKey(key: string): Promise<{ valid: boolean; companyId?: string; permissions?: string[]; error?: string }> {
    const keyPrefix = key.slice(0, 8);
    const apiKey = await prisma.aPIKey.findFirst({
      where: { keyPrefix, isActive: true, deletedAt: null },
    });

    if (!apiKey) return { valid: false, error: 'Invalid API key' };

    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    if (apiKey.keyHash !== keyHash) return { valid: false, error: 'Invalid API key' };

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false, error: 'API key expired' };
    }

    // Update last used
    await prisma.aPIKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return { valid: true, companyId: apiKey.companyId, permissions: apiKey.permissions };
  }

  /**
   * Check rate limit for API key
   */
  async checkRateLimit(apiKeyId: string, limit: number = 1000): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const windowStart = new Date(Date.now() - 60 * 60 * 1000); // 1 hour window

    const requestCount = await prisma.activityLog.count({
      where: {
        userId: apiKeyId,
        action: 'API_REQUEST',
        createdAt: { gte: windowStart },
      },
    });

    const allowed = requestCount < limit;
    const remaining = Math.max(0, limit - requestCount);
    const resetAt = new Date(windowStart.getTime() + 60 * 60 * 1000);

    return { allowed, remaining, resetAt };
  }

  /**
   * Log API request for audit
   */
  async logApiRequest(data: {
    apiKeyId: string;
    companyId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await prisma.activityLog.create({
      data: {
        companyId: data.companyId,
        userId: data.apiKeyId,
        action: 'API_REQUEST',
        description: `${data.method} ${data.endpoint}`,
        metadata: {
          statusCode: data.statusCode,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          entityType: 'API_CALL',
        },
        ipAddress: data.ipAddress || '',
      },
    });
  }

  /**
   * Create new API key
   */
  async createApiKey(data: {
    companyId: string;
    userId: string;
    name: string;
    permissions?: string[];
    expiresAt?: Date;
    rateLimit?: number;
    ipWhitelist?: string[];
  }): Promise<{ key: string; apiKey: any }> {
    const key = `fl_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = key.slice(0, 8);
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');

    const apiKey = await prisma.aPIKey.create({
      data: {
        companyId: data.companyId,
        userId: data.userId,
        name: data.name,
        keyHash,
        keyPrefix,
        permissions: data.permissions || ['read'],
        expiresAt: data.expiresAt,
        rateLimit: data.rateLimit || 1000,
        ipWhitelist: data.ipWhitelist || [],
      },
    });

    return { key, apiKey };
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(apiKeyId: string, companyId: string): Promise<void> {
    await prisma.aPIKey.updateMany({
      where: { id: apiKeyId, companyId },
      data: { isActive: false },
    });
  }

  /**
   * List API keys for company
   */
  async listApiKeys(companyId: string) {
    return prisma.aPIKey.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, keyPrefix: true, permissions: true,
        isActive: true, lastUsedAt: true, expiresAt: true, rateLimit: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get webhook events for company
   */
  async getWebhooks(companyId: string) {
    return prisma.webhook.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Deliver webhook event
   */
  async deliverWebhook(webhookId: string, event: string, payload: any): Promise<{ success: boolean; error?: string }> {
    const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook || webhook.status !== 'ACTIVE') return { success: false, error: 'Webhook inactive' };

    if (!webhook.events.includes(event) && !webhook.events.includes('*')) {
      return { success: false, error: 'Event not subscribed' };
    }

    try {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
          'X-Webhook-Id': webhookId,
        },
        body: JSON.stringify(payload),
      });

      const success = response.ok;
      await prisma.webhook.update({
        where: { id: webhookId },
        data: {
          lastTriggeredAt: new Date(),
          failureCount: success ? 0 : { increment: 1 },
        },
      });

      return { success };
    } catch (error: any) {
      await prisma.webhook.update({
        where: { id: webhookId },
        data: { lastFailedAt: new Date(), failureCount: { increment: 1 } },
      });
      return { success: false, error: error.message };
    }
  }
}
