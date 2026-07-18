import { NotificationPayload, DeliveryResult, RecipientInfo } from '../providers/types';
import { providerRegistry } from '../providers/registry';
import { notificationRepository } from '../repositories/notification.repository';
import { deliveryQueueRepository } from '../../delivery-queue/repositories/delivery-queue.repository';
import { notificationDeliveryLogRepository } from '../repositories/notification-delivery-log.repository';
import { NotificationChannel, NotificationType, NotificationPriority } from '@prisma/client';
import { emitToCompany, emitToUser } from '@/lib/socket/server';

export class NotificationEngine {
  async send(payload: NotificationPayload): Promise<DeliveryResult[]> {
    const channels = payload.channel ? [payload.channel] : [NotificationChannel.IN_APP];
    const results: DeliveryResult[] = [];

    for (const channel of channels) {
      const providers = providerRegistry.getConfiguredForChannel(channel);

      for (const provider of providers) {
        const result = await provider.send(payload, {
          userId: payload.userId || '',
        } as RecipientInfo);

        results.push(result);

        if (result.success) {
          await this.logDelivery(payload, channel, result);
        }
      }
    }

    this.emitRealtimeEvent(payload);
    return results;
  }

  async sendToUser(userId: string, payload: NotificationPayload): Promise<DeliveryResult[]> {
    return this.send({ ...payload, userId });
  }

  async sendToCompany(companyId: string, payload: NotificationPayload): Promise<DeliveryResult[]> {
    return this.send({ ...payload, companyId });
  }

  async queueNotification(payload: NotificationPayload, channel?: NotificationChannel): Promise<void> {
    await deliveryQueueRepository.create(payload.companyId, {
      notificationId: payload.userId || 'system',
      channel: channel || NotificationChannel.IN_APP,
      priority: payload.priority || NotificationPriority.NORMAL,
      scheduledFor: payload.scheduledFor,
    });
  }

  async processQueue(companyId: string, limit = 50): Promise<void> {
    const items = await deliveryQueueRepository.getPending(companyId, limit);

    for (const item of items) {
      try {
        await deliveryQueueRepository.updateStatus(item.id, companyId, 'PROCESSING');

        const notification = await notificationRepository.findById(item.notificationId, companyId);
        if (!notification) {
          await deliveryQueueRepository.updateStatus(item.id, companyId, 'FAILED', 'Notification not found');
          continue;
        }

        const payload: NotificationPayload = {
          companyId: notification.companyId,
          userId: notification.userId || undefined,
          title: notification.title,
          body: notification.body,
          type: notification.type as NotificationType,
          category: notification.category || undefined,
          channel: item.channel,
          priority: notification.priority as NotificationPriority,
          actionUrl: notification.actionUrl || undefined,
          actionLabel: notification.actionLabel || undefined,
          imageUrl: notification.imageUrl || undefined,
          metadata: notification.metadata ? JSON.parse(notification.metadata) : undefined,
          relatedEntityType: notification.relatedEntityType || undefined,
          relatedEntityId: notification.relatedEntityId || undefined,
        };

        const results = await this.send(payload);
        const allSuccess = results.every((r) => r.success);

        if (allSuccess) {
          await deliveryQueueRepository.updateStatus(item.id, companyId, 'SENT');
        } else {
          await this.handleRetry(item.id, companyId, results);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Processing error';
        await deliveryQueueRepository.updateStatus(item.id, companyId, 'FAILED', errorMessage);
      }
    }
  }

  private async handleRetry(queueItemId: string, companyId: string, results: DeliveryResult[]): Promise<void> {
    const item = await deliveryQueueRepository.findById(queueItemId, companyId);
    const newRetryCount = (item.retryCount || 0) + 1;

    if (newRetryCount >= (item.maxRetries || 3)) {
      await deliveryQueueRepository.updateStatus(queueItemId, companyId, 'FAILED', 'Max retries exceeded');
    } else {
      await deliveryQueueRepository.updateStatus(queueItemId, companyId, 'RETRYING');
      await deliveryQueueRepository.update(queueItemId, companyId, { retryCount: newRetryCount });
    }
  }

  private async logDelivery(
    payload: NotificationPayload,
    channel: NotificationChannel,
    result: DeliveryResult
  ): Promise<void> {
    if (!payload.userId) return;

    const notification = await notificationRepository.findAll(payload.companyId, {
      userId: payload.userId,
      page: 1,
      limit: 1,
    });

    if (notification.notifications.length > 0) {
      await notificationDeliveryLogRepository.create({
        notificationId: notification.notifications[0].id,
        channel,
        status: result.success ? 'DELIVERED' : 'FAILED',
        provider: result.provider,
        providerResponse: result.providerResponse,
        errorMessage: result.errorMessage,
        deliveredAt: result.deliveredAt,
      });
    }
  }

  private emitRealtimeEvent(payload: NotificationPayload): void {
    if (payload.channel === NotificationChannel.IN_APP) {
      emitToCompany(payload.companyId, 'notification:new', {
        title: payload.title,
        body: payload.body,
        type: payload.type,
        priority: payload.priority,
        createdAt: new Date().toISOString(),
      });

      if (payload.userId) {
        emitToUser(payload.userId, 'notification:new', {
          title: payload.title,
          body: payload.body,
          type: payload.type,
          priority: payload.priority,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }
}

export const notificationEngine = new NotificationEngine();
