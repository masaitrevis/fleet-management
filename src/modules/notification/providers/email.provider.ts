import { NotificationPayload, DeliveryResult, NotificationProvider, RecipientInfo } from './types';
import { NotificationChannel } from '@prisma/client';

export class EmailProvider implements NotificationProvider {
  name = 'Resend';
  channel = NotificationChannel.EMAIL;
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@limifleet.com';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async send(payload: NotificationPayload, recipient: RecipientInfo): Promise<DeliveryResult> {
    if (!this.isConfigured()) {
      return { success: false, provider: this.name, errorMessage: 'Resend API key not configured' };
    }
    if (!recipient.email) {
      return { success: false, provider: this.name, errorMessage: 'Recipient email not provided' };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: recipient.email,
          subject: payload.title,
          html: this.buildHtml(payload),
          text: payload.body,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }

      const result = await response.json();

      return {
        success: true,
        provider: this.name,
        providerResponse: JSON.stringify(result),
        deliveredAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        errorMessage: error instanceof Error ? error.message : 'Email delivery failed',
      };
    }
  }

  private buildHtml(payload: NotificationPayload): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><style>body{font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;}h1{color:#111827;}p{color:#374151;line-height:1.6;}a{display:inline-block;margin-top:16px;padding:12px 24px;background:#111827;color:#fff;text-decoration:none;border-radius:6px;}</style></head>
      <body>
        <h1>${payload.title}</h1>
        <p>${payload.body}</p>
        ${payload.actionUrl ? `<a href="${payload.actionUrl}">${payload.actionLabel || 'View Details'}</a>` : ''}
      </body>
      </html>
    `;
  }
}

export const emailProvider = new EmailProvider();
