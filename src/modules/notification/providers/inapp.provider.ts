import { NotificationPayload, DeliveryResult, NotificationProvider } from './types';
import { NotificationChannel } from '@prisma/client';
import { notificationRepository } from '../repositories/notification.repository';

export class InAppProvider implements NotificationProvider {
  name = 'InApp';
  channel = NotificationChannel.IN_APP;

  isConfigured(): boolean { return true; }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    try {
      const notification = await notificationRepository.create(payload.companyId, {
        userId: payload.userId,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        category: payload.category,
        channel: this.channel,
        priority: payload.priority,
        actionUrl: payload.actionUrl,
        actionLabel: payload.actionLabel,
        imageUrl: payload.imageUrl,
        metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
        relatedEntityType: payload.relatedEntityType,
        relatedEntityId: payload.relatedEntityId,
        scheduledFor: payload.scheduledFor,
        templateId: payload.templateId,
      });

      return {
        success: true,
        provider: this.name,
        deliveredAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const inAppProvider = new InAppProvider();
