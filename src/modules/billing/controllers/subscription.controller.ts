import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '../services/subscription.service';
import { PaymentProviderFactory } from '../providers/payment-provider.interface';
import { StripeProvider } from '../providers/stripe.provider';
import { MPesaProvider } from '../providers/mpesa.provider';

// Register providers
PaymentProviderFactory.register('stripe', new StripeProvider());
PaymentProviderFactory.register('mpesa', new MPesaProvider());

export class SubscriptionController {
  static async getCurrent(req: NextRequest, companyId: string) {
    try {
      const service = new SubscriptionService(companyId);
      const subscription = await service.getCurrentSubscription();
      if (!subscription) return NextResponse.json({ success: false, error: 'No subscription found' }, { status: 404 });
      return NextResponse.json({ success: true, data: subscription });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async listPlans(req: NextRequest) {
    try {
      const service = new SubscriptionService('');
      const plans = await service.getAvailablePlans();
      return NextResponse.json({ success: true, data: plans });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async startTrial(req: NextRequest, companyId: string) {
    try {
      const body = await req.json();
      const service = new SubscriptionService(companyId);
      const subscription = await service.startTrial(body.planId);
      return NextResponse.json({ success: true, data: subscription }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async activate(req: NextRequest, companyId: string) {
    try {
      const body = await req.json();
      const service = new SubscriptionService(companyId);
      const subscription = await service.activateSubscription(body);
      return NextResponse.json({ success: true, data: subscription }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async upgrade(req: NextRequest, companyId: string) {
    try {
      const body = await req.json();
      const service = new SubscriptionService(companyId);
      const subscription = await service.upgrade(body.planId);
      return NextResponse.json({ success: true, data: subscription });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async downgrade(req: NextRequest, companyId: string) {
    try {
      const body = await req.json();
      const service = new SubscriptionService(companyId);
      const subscription = await service.downgrade(body.planId);
      return NextResponse.json({ success: true, data: subscription });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async cancel(req: NextRequest, companyId: string) {
    try {
      const body = await req.json();
      const service = new SubscriptionService(companyId);
      const subscription = await service.cancel(body.reason);
      return NextResponse.json({ success: true, data: subscription });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async pause(req: NextRequest, companyId: string) {
    try {
      const service = new SubscriptionService(companyId);
      const subscription = await service.pause();
      return NextResponse.json({ success: true, data: subscription });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async resume(req: NextRequest, companyId: string) {
    try {
      const service = new SubscriptionService(companyId);
      const subscription = await service.resume();
      return NextResponse.json({ success: true, data: subscription });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getHistory(req: NextRequest, companyId: string) {
    try {
      const service = new SubscriptionService(companyId);
      const history = await service.getSubscriptionHistory();
      return NextResponse.json({ success: true, data: history });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
}
