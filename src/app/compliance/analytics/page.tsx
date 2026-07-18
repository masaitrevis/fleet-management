"use client";

import { useEffect, useState } from "react";

export default function ComplianceAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/compliance/analytics").then(r => r.json()),
      fetch("/api/compliance/analytics/score").then(r => r.json()),
      fetch("/api/compliance/analytics/trends").then(r => r.json()),
    ]).then(([overview, score, trends]) => {
      setData({ overview: overview.data, score: score.data, trends: trends.data });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center">Failed to load.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Compliance Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(data.overview || {}).map(([key, value]) => (
          <div key={key} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
            <p className="text-2xl font-bold text-gray-900">{String(value)}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Compliance Score: {data.score?.score}%</h3>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: `${data.score?.score}%` }} />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Incident Trends by Type</h3>
        <div className="space-y-2">
          {(data.trends || []).map((t: any) => (
            <div key={t.incidentType} className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">{t.incidentType}</span>
              <span className="text-sm font-medium text-gray-900">{t._count?.id || 0} incidents</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
