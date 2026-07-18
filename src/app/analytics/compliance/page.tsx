"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/analytics/KPICard";
import { Shield, FileWarning, AlertTriangle, XCircle } from "lucide-react";

export default function ComplianceAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/compliance");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="p-8 text-center">Loading compliance analytics...</div>;
  if (!data) return <div className="p-8 text-center">No data available</div>;

  const d: any = data;
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Compliance Analytics</h1></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Compliance Score" value={`${d.complianceScore}%`} icon={Shield} color="green" />
        <KPICard title="Expiring Docs" value={d.expiringDocuments} icon={FileWarning} color="amber" />
        <KPICard title="Violations" value={d.violations} icon={XCircle} color="red" />
        <KPICard title="Incidents" value={d.incidents} icon={AlertTriangle} color="orange" />
      </div>
    </div>
  );
}
