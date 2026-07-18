import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationEngine } from '../engine/notification-engine';
import { inAppProvider } from '../providers/inapp.provider';
import { emailProvider } from '../providers/email.provider';
import { pushProvider } from '../providers/push.provider';
import { smsProvider } from '../providers/sms.provider';
import { webSocketProvider } from '../providers/websocket.provider';
import { NotificationChannel, NotificationType, NotificationPriority } from '@prisma/client';

describe('Provider Registry', () => {
  it('should register all providers', () => {
    expect(inAppProvider.channel).toBe(NotificationChannel.IN_APP);
    expect(emailProvider.channel).toBe(NotificationChannel.EMAIL);
    expect(pushProvider.channel).toBe(NotificationChannel.PUSH);
    expect(smsProvider.channel).toBe(NotificationChannel.SMS);
    expect(webSocketProvider.channel).toBe(NotificationChannel.WEBHOOK);
  });

  it('should check configuration status', () => {
    expect(inAppProvider.isConfigured()).toBe(true);
    expect(emailProvider.isConfigured()).toBe(false);
    expect(pushProvider.isConfigured()).toBe(false);
    expect(smsProvider.isConfigured()).toBe(false);
  });
});

describe('InApp Provider', () => {
  it('should always succeed for in-app delivery', async () => {
    const result = await inAppProvider.send({
      companyId: 'test-company',
      title: 'Test',
      body: 'Test body',
      type: NotificationType.TRIP_STARTED,
      priority: NotificationPriority.NORMAL,
    }, { userId: 'test-user' });

    expect(result.success).toBe(true);
    expect(result.provider).toBe('InApp');
  });
});

describe('Email Provider', () => {
  it('should fail when not configured', async () => {
    const result = await emailProvider.send({
      companyId: 'test-company',
      title: 'Test',
      body: 'Test body',
      type: NotificationType.TRIP_STARTED,
      priority: NotificationPriority.NORMAL,
    }, { userId: 'test-user' });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain('not configured');
  });
});

describe('Notification Engine', () => {
  const engine = new NotificationEngine();

  it('should send notification to configured channels', async () => {
    const results = await engine.send({
      companyId: 'test-company',
      title: 'Test Notification',
      body: 'Test body',
      type: NotificationType.TRIP_STARTED,
      priority: NotificationPriority.NORMAL,
    });

    expect(Array.isArray(results)).toBe(true);
  });
});
