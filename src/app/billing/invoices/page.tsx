"use client";
import { useEffect, useState } from "react";
import { InvoiceTable } from "@/components/billing/InvoiceTable";
import { FileText, AlertCircle } from "lucide-react";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/billing/invoices").then((r) => r.json()),
      fetch("/api/billing/overdue").then((r) => r.json()),
    ])
      .then(([invRes, overRes]) => {
        if (invRes.success) setInvoices(invRes.data?.items || []);
        if (overRes.success) setOverdue(overRes.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading invoices...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Invoices & Billing</h1>

      {overdue.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="font-medium text-red-800 dark:text-red-300">{overdue.length} overdue invoice{overdue.length > 1 ? "s" : ""}</span>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice History</h2>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{invoices.length} total</span>
        </div>
        <div className="p-4">
          <InvoiceTable invoices={invoices} />
        </div>
      </div>
    </div>
  );
}
