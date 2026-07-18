"use client";

import { useEffect, useState } from "react";

export default function NotificationAnalytics() {
  const [stats, setStats] = useState({ total: 0, unread: 0, pending: 0, failed: 0, today: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications/stats")
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;

  const successRate = stats.total > 0 ? Math.round(((stats.total - stats.pending - stats.failed) / stats.total) * 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notification Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
            <p className="text-2xl font-bold text-gray-900">{String(value)}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Delivery Success Rate: {successRate}%</h3>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: `${successRate}%` }} />
        </div>
      </div>
    </div>
  );
}
