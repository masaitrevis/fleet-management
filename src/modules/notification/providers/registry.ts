import { NotificationChannel } from '@prisma/client';
import { NotificationProvider } from './types';
import { inAppProvider } from './inapp.provider';
import { emailProvider } from './email.provider';
import { pushProvider } from './push.provider';
import { smsProvider } from './sms.provider';
import { webSocketProvider } from './websocket.provider';

class ProviderRegistry {
  private providers = new Map<NotificationChannel, NotificationProvider[]>();

  constructor() {
    this.register(inAppProvider);
    this.register(emailProvider);
    this.register(pushProvider);
    this.register(smsProvider);
    this.register(webSocketProvider);
  }

  register(provider: NotificationProvider): void {
    const existing = this.providers.get(provider.channel) || [];
    existing.push(provider);
    this.providers.set(provider.channel, existing);
  }

  get(channel: NotificationChannel): NotificationProvider[] {
    return this.providers.get(channel) || [];
  }

  getAllConfigured(): NotificationProvider[] {
    const all: NotificationProvider[] = [];
    this.providers.forEach((providers) => {
      providers.forEach((p) => {
        if (p.isConfigured()) all.push(p);
      });
    });
    return all;
  }

  getConfiguredForChannel(channel: NotificationChannel): NotificationProvider[] {
    return this.get(channel).filter((p) => p.isConfigured());
  }
}

export const providerRegistry = new ProviderRegistry();
