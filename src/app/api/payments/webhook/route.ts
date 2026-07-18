import { NextRequest, NextResponse } from 'next/server';
import { PaymentProviderFactory } from '@/modules/billing/providers/payment-provider.interface';
import { StripeProvider } from '@/modules/billing/providers/stripe.provider';
import { MPesaProvider } from '@/modules/billing/providers/mpesa.provider';

// Register providers
PaymentProviderFactory.register('stripe', new StripeProvider());
PaymentProviderFactory.register('mpesa', new MPesaProvider());

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider') || 'stripe';

    const payload = await req.json();
    const signature = req.headers.get('stripe-signature') || req.headers.get('x-mpesa-signature') || undefined;

    const paymentProvider = PaymentProviderFactory.get(provider);
    const result = await paymentProvider.processWebhook(payload, signature || undefined);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Process webhook event based on type
    // In production: update subscription status, record payment, send notifications, etc.

    return NextResponse.json({ success: true, eventType: result.eventType });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
