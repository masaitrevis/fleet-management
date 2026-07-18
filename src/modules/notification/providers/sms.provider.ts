import { NotificationPayload, DeliveryResult, NotificationProvider, RecipientInfo } from './types';
import { NotificationChannel } from '@prisma/client';

export class SmsProvider implements NotificationProvider {
  name = 'Twilio';
  channel = NotificationChannel.SMS;
  private accountSid: string;
  private authToken: string;
  private fromPhone: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromPhone = process.env.TWILIO_FROM_PHONE || '';
  }

  isConfigured(): boolean {
    return !!(this.accountSid && this.authToken && this.fromPhone);
  }

  async send(payload: NotificationPayload, recipient: RecipientInfo): Promise<DeliveryResult> {
    if (!this.isConfigured()) {
      return { success: false, provider: this.name, errorMessage: 'Twilio credentials not configured' };
    }
    if (!recipient.phone) {
      return { success: false, provider: this.name, errorMessage: 'Recipient phone not provided' };
    }

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: this.fromPhone,
            To: recipient.phone,
            Body: `${payload.title}: ${payload.body}`,
          }).toString(),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Twilio error: ${error}`);
      }

      const result = await response.json();

      return {
        success: result.status === 'queued' || result.status === 'sent',
        provider: this.name,
        providerResponse: JSON.stringify(result),
        deliveredAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        errorMessage: error instanceof Error ? error.message : 'SMS delivery failed',
      };
    }
  }
}

export const smsProvider = new SmsProvider();
