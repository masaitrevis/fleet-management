"use client";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

export default function CustomerHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customer/shipments/history")
      .then((r) => r.json())
      .then((json) => { if (json.success) setHistory(json.data?.items || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center">Loading history...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery History</h1>
      {history.length === 0 && <p className="text-gray-500">No delivery history</p>}
      {history.map((h: any) => (
        <div key={h.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{h.tripNumber || h.title || "Delivery"}</p>
              <p className="text-sm text-gray-500">{h.vehicle?.registrationNumber} · {new Date(h.actualEndTime || h.updatedAt).toLocaleDateString()}</p>
            </div>
            {h.status === "COMPLETED" ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
