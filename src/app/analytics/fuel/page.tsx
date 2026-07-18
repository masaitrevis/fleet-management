"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/analytics/KPICard";
import { DateRangeFilter } from "@/components/analytics/DateRangeFilter";
import { Fuel, DollarSign, Gauge, AlertTriangle } from "lucide-react";

export default function FuelAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const res = await fetch(`/api/analytics/fuel?${params.toString()}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  if (loading) return <div className="p-8 text-center">Loading fuel analytics...</div>;
  if (!data) return <div className="p-8 text-center">No data available</div>;

  const d: any = data;
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Fuel Analytics</h1></div>
        <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} onApply={fetchData} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Consumption" value={d.totalConsumption} icon={Fuel} color="blue" subtitle="liters" />
        <KPICard title="Total Cost" value={`KES ${d.totalCost.toLocaleString()}`} icon={DollarSign} color="red" />
        <KPICard title="Cost/Km" value={`KES ${d.costPerKm}`} icon={Gauge} color="amber" />
        <KPICard title="Fraud Alerts" value={d.fraudAlerts} icon={AlertTriangle} color="orange" />
      </div>
    </div>
  );
}
