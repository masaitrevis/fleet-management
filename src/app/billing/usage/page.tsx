"use client";
import { useEffect, useState } from "react";
import { UsageBar } from "@/components/billing/UsageBar";
import { BarChart3, RefreshCw } from "lucide-react";

export default function UsagePage() {
  const [usage, setUsage] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/usage");
      const json = await res.json();
      if (json.success) setUsage(json.data || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsage(); }, []);

  const resourceLabels: Record<string, string> = {
    VEHICLE: "Vehicles",
    DRIVER: "Drivers",
    USER: "Users",
    BRANCH: "Branches",
    WAREHOUSE: "Warehouses",
    GPS_DEVICE: "GPS Devices",
    API_REQUEST: "API Requests",
    STORAGE: "Storage (GB)",
    REPORT: "Reports",
    NOTIFICATION: "Notifications",
  };

  if (loading) return <div className="p-8 text-center">Loading usage...</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usage Dashboard</h1>
        <button onClick={fetchUsage} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Period Usage</h2>
        </div>

        <div className="space-y-5">
          {Object.entries(usage).map(([key, data]) => (
            <UsageBar
              key={key}
              label={resourceLabels[key] || key}
              current={data?.currentUsage || 0}
              limit={data?.limitValue || null}
              unit={key === "STORAGE" ? "GB" : ""}
            />
          ))}
          {Object.keys(usage).length === 0 && (
            <p className="text-center text-sm text-gray-500">No usage data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
