"use client";
import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customer/invoices")
      .then((r) => r.json())
      .then((json) => { if (json.success) setInvoices(json.data?.items || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center">Loading invoices...</div>;

  const statusColors: Record<string, string> = {
    PAID: "bg-green-100 text-green-700",
    DRAFT: "bg-gray-100 text-gray-700",
    SENT: "bg-blue-100 text-blue-700",
    OVERDUE: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900
      {invoices.length === 0 && <p className="text-gray-500">No invoices found</p>}
      {invoices.map((inv: any) => (
        <div key={inv.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900
              <p className="text-sm text-gray-500">{new Date(inv.issueDate).toLocaleDateString()} · {inv.currency} {inv.total?.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[inv.status] || statusColors.DRAFT}`}>
              {inv.status}
            </span>
            <button className="rounded p-1 hover:bg-gray-100 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
