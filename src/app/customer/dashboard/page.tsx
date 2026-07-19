"use client";
import { useEffect, useState } from "react";
import { Package, CheckCircle, Clock, DollarSign, AlertCircle } from "lucide-react";

export default function CustomerDashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/customer/dashboard").then((r) => r.json()),
      fetch("/api/customer/shipments").then((r) => r.json()),
    ])
      .then(([dashRes, shipRes]) => {
        if (dashRes.success) setSummary(dashRes.data);
        if (shipRes.success) setShipments(shipRes.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center">Loading dashboard...</div>;

  const stats = [
    { label: "Active Shipments", value: summary?.activeShipments || 0, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Completed", value: summary?.completedDeliveries || 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending Invoices", value: summary?.pendingInvoices || 0, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500
                <p className="text-2xl font-bold text-gray-900
              </div>
              <div className={`rounded-lg p-2 ${s.bg}
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white
        <div className="border-b border-gray-200 px-4 py-3
          <h2 className="font-semibold text-gray-900 Shipments</h2>
        </div>
        <div className="divide-y
          {shipments.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-gray-500">No active shipments</p>
          )}
          {shipments.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-gray-900 || s.title || "Shipment"}</p>
                <p className="text-sm text-gray-500">{s.vehicle?.registrationNumber} · {s.status}</p>
              </div>
              <div className="flex items-center gap-2">
                {s.status === "IN_PROGRESS" && <Clock className="h-4 w-4 text-blue-500" />}
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  s.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
