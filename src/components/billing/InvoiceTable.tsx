"use client";
import { Download, Eye } from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  currency: string;
}

interface InvoiceTableProps {
  invoices: Invoice[];
}

const statusColors: Record<string, string> = {
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PARTIAL: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500",
};

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  if (invoices.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">No invoices yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">Invoice #</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Due</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b dark:border-gray-700">
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{inv.invoiceNumber}</td>
              <td className="px-4 py-3">{new Date(inv.issueDate).toLocaleDateString()}</td>
              <td className="px-4 py-3">{new Date(inv.dueDate).toLocaleDateString()}</td>
              <td className="px-4 py-3">{inv.currency} {inv.total.toLocaleString()}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[inv.status] || statusColors.DRAFT}`}>
                  {inv.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"><Eye className="h-4 w-4" /></button>
                  <button className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"><Download className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
