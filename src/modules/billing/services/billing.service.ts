import { prisma } from '@/lib/prisma';
import { InvoiceStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  taxRate?: number;
  discountAmount?: number;
  notes?: string;
  terms?: string;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentData {
  invoiceId: string;
  amount: number;
  currency?: string;
  method: PaymentMethod;
  transactionId?: string;
  gatewayResponse?: any;
  notes?: string;
}

export class BillingService {
  constructor(private companyId: string) {}

  async generateInvoice(data: InvoiceData): Promise<any> {
    const taxRate = data.taxRate || 0;
    const taxAmount = data.subtotal * (taxRate / 100);
    const discountAmount = data.discountAmount || 0;
    const total = data.subtotal + taxAmount - discountAmount;
    const amountDue = total;

    const invoice = await prisma.invoice.create({
      data: {
        companyId: this.companyId,
        invoiceNumber: data.invoiceNumber,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        subtotal: data.subtotal,
        taxRate,
        taxAmount,
        discountAmount,
        total,
        amountPaid: 0,
        amountDue,
        status: InvoiceStatus.DRAFT,
        currency: 'KES',
        notes: data.notes,
        terms: data.terms,
      },
    });

    return invoice;
  }

  async getInvoices(page = 1, limit = 20): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { companyId: this.companyId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { issueDate: 'desc' },
      }),
      prisma.invoice.count({ where: { companyId: this.companyId, deletedAt: null } }),
    ]);

    return { items, total, page, limit };
  }

  async getInvoiceById(id: string): Promise<any> {
    return prisma.invoice.findUnique({
      where: { id, companyId: this.companyId },
      include: { payments: true },
    });
  }

  async processPayment(data: PaymentData): Promise<any> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId, companyId: this.companyId },
    });
    if (!invoice) throw new Error('Invoice not found');

    const payment = await prisma.payment.create({
      data: {
        companyId: this.companyId,
        invoiceId: data.invoiceId,
        amount: data.amount,
        currency: data.currency || 'KES',
        method: data.method,
        status: PaymentStatus.PAID,
        transactionId: data.transactionId,
        gatewayResponse: data.gatewayResponse,
        paidAt: new Date(),
        notes: data.notes,
      },
    });

    // Update invoice amounts
    const newAmountPaid = invoice.amountPaid + data.amount;
    const newAmountDue = invoice.total - newAmountPaid;
    let newStatus: InvoiceStatus = InvoiceStatus.SENT;
    if (newAmountDue <= 0) newStatus = InvoiceStatus.PAID;
    else if (newAmountPaid > 0) newStatus = InvoiceStatus.VIEWED;

    await prisma.invoice.update({
      where: { id: data.invoiceId },
      data: {
        amountPaid: newAmountPaid,
        amountDue: Math.max(0, newAmountDue),
        status: newStatus,
        paidDate: newStatus === InvoiceStatus.PAID ? new Date() : undefined,
      },
    });

    return payment;
  }

  async generateCreditNote(invoiceId: string, amount: number, reason: string): Promise<any> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, companyId: this.companyId },
    });
    if (!invoice) throw new Error('Invoice not found');

    // Create a new invoice with negative amount as credit note
    const creditNote = await prisma.invoice.create({
      data: {
        companyId: this.companyId,
        invoiceNumber: `CN-${invoice.invoiceNumber}`,
        issueDate: new Date(),
        dueDate: new Date(),
        subtotal: -amount,
        taxRate: 0,
        taxAmount: 0,
        discountAmount: 0,
        total: -amount,
        amountPaid: 0,
        amountDue: -amount,
        status: InvoiceStatus.PAID,
        currency: invoice.currency,
        notes: `Credit note for invoice ${invoice.invoiceNumber}: ${reason}`,
      },
    });

    return creditNote;
  }

  async getPaymentHistory(page = 1, limit = 20): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where: { companyId: this.companyId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { paidAt: 'desc' },
      }),
      prisma.payment.count({ where: { companyId: this.companyId, deletedAt: null } }),
    ]);

    return { items, total, page, limit };
  }

  async getPaymentById(id: string): Promise<any> {
    return prisma.payment.findUnique({
      where: { id, companyId: this.companyId },
    });
  }

  async getOverdueInvoices(): Promise<any[]> {
    return prisma.invoice.findMany({
      where: {
        companyId: this.companyId,
        deletedAt: null,
        dueDate: { lt: new Date() },
        status: { notIn: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
