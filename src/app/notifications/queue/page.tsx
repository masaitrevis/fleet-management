"use client";

import { useEffect, useState } from "react";
import { List, RefreshCw, Search, ArrowLeftRight, XCircle, CheckCircle } from "lucide-react";
import { DeliveryStatusBadge } from "@/components/notifications/DeliveryStatusBadge";

interface QueueItem {
  id: string;
  channel: string;
  status: string;
  priority: string;
  retryCount: number;
  maxRetries: number;
  scheduledFor?: string;
  errorMessage?: string;
  createdAt: string;
  processedAt?: string;
}

export default function DeliveryQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "failed" | "processing">("all");

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const statusQuery = filter !== "all" ? `?status=${filter.toUpperCase()}` : "";
      const res = await fetch(`/api/delivery-queue${statusQuery}`);
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQueue(); }, [filter]);

  const handleRetry = async (id: string) => {
    try {
      const res = await fetch(`/api/delivery-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "QUEUED", retryCount: 0 }),
      });
      if (res.ok) fetchQueue();
    } catch (error) { console.error(error); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this delivery?")) return;
    try {
      const res = await fetch(`/api/delivery-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) fetchQueue();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Queue</h1>
          <p className="text-sm text-gray-500">{items.length} items in queue</p>
        </div>
        <button onClick={fetchQueue} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search queue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              {(["all", "pending", "processing", "failed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${filter === f ? "bg-blue-50 text-blue-700 border-blue-200" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading queue...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <List className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Queue is empty</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Channel</th>
                  <th className="px-4 py-3 text-left font-medium">Priority</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Retries</th>
                  <th className="px-4 py-3 text-left font-medium">Scheduled</th>
                  <th className="px-4 py-3 text-left font-medium">Error</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{item.channel}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${item.priority === "CRITICAL" ? "bg-red-100 text-red-700" : item.priority === "HIGH" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <DeliveryStatusBadge status={item.status as any} />
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.retryCount}/{item.maxRetries}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.scheduledFor ? new Date(item.scheduledFor).toLocaleString() : "Immediate"}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-red-600 text-xs">{item.errorMessage || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.status === "FAILED" && (
                          <button onClick={() => handleRetry(item.id)} className="p-1.5 hover:bg-gray-100 rounded" title="Retry">
                            <ArrowLeftRight className="w-4 h-4" />
                          </button>
                        )}
                        {item.status !== "CANCELLED" && item.status !== "DELIVERED" && (
                          <button onClick={() => handleCancel(item.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Cancel">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
