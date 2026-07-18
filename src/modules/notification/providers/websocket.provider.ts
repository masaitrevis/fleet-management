import { NotificationPayload, DeliveryResult, NotificationProvider } from './types';
import { NotificationChannel } from '@prisma/client';
import { getSocketServer } from '@/lib/socket/server';

export class WebSocketProvider implements NotificationProvider {
  name = 'Socket.IO';
  channel = NotificationChannel.WEBHOOK;

  isConfigured(): boolean { return !!getSocketServer(); }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    const io = getSocketServer();
    if (!io) {
      return { success: false, provider: this.name, errorMessage: 'Socket.IO server not initialized' };
    }

    try {
      const room = `company:${payload.companyId}`;
      const userRoom = payload.userId ? `user:${payload.userId}` : null;

      const eventData = {
        id: payload.userId,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        category: payload.category,
        priority: payload.priority,
        actionUrl: payload.actionUrl,
        actionLabel: payload.actionLabel,
        imageUrl: payload.imageUrl,
        metadata: payload.metadata,
        relatedEntityType: payload.relatedEntityType,
        relatedEntityId: payload.relatedEntityId,
        createdAt: new Date().toISOString(),
      };

      io.to(room).emit('notification:new', eventData);
      if (userRoom) {
        io.to(userRoom).emit('notification:new', eventData);
      }

      return {
        success: true,
        provider: this.name,
        deliveredAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        errorMessage: error instanceof Error ? error.message : 'WebSocket delivery failed',
      };
    }
  }
}

export const webSocketProvider = new WebSocketProvider();
