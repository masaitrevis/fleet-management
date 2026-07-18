"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/analytics/KPICard";
import { DateRangeFilter } from "@/components/analytics/DateRangeFilter";
import { DollarSign, Wrench, Fuel, Car } from "lucide-react";

export default function FinancialAnalyticsPage() {
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
      const res = await fetch(`/api/analytics/financial?${params.toString()}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  if (loading) return <div className="p-8 text-center">Loading financial analytics...</div>;
  if (!data) return <div className="p-8 text-center">No data available</div>;

  const d: any = data;
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Financial Analytics</h1></div>
        <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} onApply={fetchData} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Operating Cost" value={`KES ${d.operatingCost.toLocaleString()}`} icon={DollarSign} color="red" />
        <KPICard title="Maintenance" value={`KES ${d.maintenanceCost.toLocaleString()}`} icon={Wrench} color="blue" />
        <KPICard title="Fuel Cost" value={`KES ${d.fuelCost.toLocaleString()}`} icon={Fuel} color="amber" />
        <KPICard title="Cost/Vehicle" value={`KES ${d.costPerVehicle.toLocaleString()}`} icon={Car} color="green" />
      </div>
    </div>
  );
}
