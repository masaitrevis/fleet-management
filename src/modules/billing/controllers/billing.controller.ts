import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '../services/billing.service';

export class BillingController {
  static async getInvoices(req: NextRequest, companyId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

      const service = new BillingService(companyId);
      const result = await service.getInvoices(page, limit);
      return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getInvoiceById(req: NextRequest, companyId: string, id: string) {
    try {
      const service = new BillingService(companyId);
      const invoice = await service.getInvoiceById(id);
      if (!invoice) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: invoice });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async createInvoice(req: NextRequest, companyId: string) {
    try {
      const body = await req.json();
      const service = new BillingService(companyId);
      const invoice = await service.generateInvoice(body);
      return NextResponse.json({ success: true, data: invoice }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async processPayment(req: NextRequest, companyId: string) {
    try {
      const body = await req.json();
      const service = new BillingService(companyId);
      const payment = await service.processPayment(body);
      return NextResponse.json({ success: true, data: payment }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getPaymentHistory(req: NextRequest, companyId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

      const service = new BillingService(companyId);
      const result = await service.getPaymentHistory(page, limit);
      return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getOverdueInvoices(req: NextRequest, companyId: string) {
    try {
      const service = new BillingService(companyId);
      const invoices = await service.getOverdueInvoices();
      return NextResponse.json({ success: true, data: invoices });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async createCreditNote(req: NextRequest, companyId: string, id: string) {
    try {
      const body = await req.json();
      const service = new BillingService(companyId);
      const creditNote = await service.generateCreditNote(id, body.amount, body.reason);
      return NextResponse.json({ success: true, data: creditNote }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
}
