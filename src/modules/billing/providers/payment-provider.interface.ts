/**
 * Payment Provider Interface
 * All payment gateways implement this interface.
 * Stripe, M-Pesa, PayPal, Flutterwave, Pesapal, etc.
 */
export interface PaymentProvider {
  name: string;
  initialize(config: ProviderConfig): void;
  createPaymentIntent(amount: number, currency: string, metadata: Record<string, any>): Promise<PaymentIntentResult>;
  verifyPayment(transactionId: string): Promise<PaymentVerificationResult>;
  refund(transactionId: string, amount?: number): Promise<RefundResult>;
  cancelPayment(transactionId: string): Promise<CancelResult>;
  processWebhook(payload: any, signature?: string): Promise<WebhookResult>;
  createSubscription(planId: string, customerId: string, metadata?: Record<string, any>): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string): Promise<CancelResult>;
}

export interface ProviderConfig {
  apiKey: string;
  secretKey?: string;
  publicKey?: string;
  webhookSecret?: string;
  baseUrl?: string;
  environment: 'sandbox' | 'production';
}

export interface PaymentIntentResult {
  success: boolean;
  transactionId?: string;
  clientSecret?: string;
  paymentUrl?: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, any>;
  error?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paidAt?: Date;
  metadata?: Record<string, any>;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount: number;
  status: string;
  error?: string;
}

export interface CancelResult {
  success: boolean;
  status: string;
  error?: string;
}

export interface WebhookResult {
  success: boolean;
  eventType: string;
  eventId?: string;
  data?: Record<string, any>;
  error?: string;
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  status: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  error?: string;
}

export class PaymentProviderFactory {
  private static providers: Map<string, PaymentProvider> = new Map();

  static register(name: string, provider: PaymentProvider): void {
    this.providers.set(name, provider);
  }

  static get(name: string): PaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) throw new Error(`Payment provider '${name}' not registered`);
    return provider;
  }

  static has(name: string): boolean {
    return this.providers.has(name);
  }

  static list(): string[] {
    return Array.from(this.providers.keys());
  }
}
