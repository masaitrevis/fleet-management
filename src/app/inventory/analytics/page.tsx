"use client";

import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/inventory/analytics").then(r => r.json()),
      fetch("/api/inventory/analytics/stock-value").then(r => r.json()),
      fetch("/api/inventory/analytics/top-moving").then(r => r.json()),
    ]).then(([overview, stockValue, topMoving]) => {
      setData({ overview: overview.data, stockValue: stockValue.data, topMoving: topMoving.data });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center">Failed to load analytics.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inventory Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(data.overview || {}).map(([key, value]) => (
          <div key={key} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
            <p className="text-2xl font-bold text-gray-900">{String(value)}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Stock Value by Warehouse</h3>
          <div className="space-y-2">
            {(data.stockValue || []).map((w: any) => (
              <div key={w.name} className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">{w.name}</span>
                <span className="text-sm font-medium text-gray-900">KES {w.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Top Moving Parts</h3>
          <div className="space-y-2">
            {(data.topMoving || []).map((p: any) => (
              <div key={p.stockId} className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">{p.partName}</span>
                <span className="text-sm font-medium text-gray-900">{p.totalQuantity} units</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
