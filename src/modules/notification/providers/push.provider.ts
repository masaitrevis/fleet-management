import { NotificationPayload, DeliveryResult, NotificationProvider, RecipientInfo } from './types';
import { NotificationChannel } from '@prisma/client';

export class PushProvider implements NotificationProvider {
  name = 'FCM';
  channel = NotificationChannel.PUSH;
  private serverKey: string;

  constructor() {
    this.serverKey = process.env.FCM_SERVER_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.serverKey;
  }

  async send(payload: NotificationPayload, recipient: RecipientInfo): Promise<DeliveryResult> {
    if (!this.isConfigured()) {
      return { success: false, provider: this.name, errorMessage: 'FCM server key not configured' };
    }
    if (!recipient.pushToken) {
      return { success: false, provider: this.name, errorMessage: 'Push token not provided' };
    }

    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipient.pushToken,
          notification: {
            title: payload.title,
            body: payload.body,
            image: payload.imageUrl,
          },
          data: {
            type: payload.type,
            actionUrl: payload.actionUrl,
            relatedEntityType: payload.relatedEntityType,
            relatedEntityId: payload.relatedEntityId,
            ...payload.metadata,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`FCM error: ${error}`);
      }

      const result = await response.json();

      return {
        success: result.success === 1,
        provider: this.name,
        providerResponse: JSON.stringify(result),
        deliveredAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        errorMessage: error instanceof Error ? error.message : 'Push delivery failed',
      };
    }
  }
}

export const pushProvider = new PushProvider();
