"use client";

import { useEffect, useState, useRef } from "react";
import * as echarts from "echarts";
import { KPICard } from "@/components/analytics/KPICard";
import { DateRangeFilter } from "@/components/analytics/DateRangeFilter";
import { Car, Wrench, Clock, AlertTriangle } from "lucide-react";

interface FleetData {
  totalVehicles: number;
  activeVehicles: number;
  vehicleUtilization: number;
  fleetAvailability: number;
  activeTrips: number;
  completedTrips: number;
  vehicleDowntime: number;
  avgTripDuration: number;
}

export default function FleetAnalyticsPage() {
  const [data, setData] = useState<FleetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const statusChartRef = useRef<HTMLDivElement>(null);
  const tripsChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  useEffect(() => {
    if (!data || !statusChartRef.current || !tripsChartRef.current) return;

    const statusChart = echarts.init(statusChartRef.current);
    statusChart.setOption({
      title: { text: "Vehicle Status", left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "item" },
      legend: { bottom: 0 },
      series: [{
        type: "pie",
        radius: ["40%", "70%"],
        data: [
          { value: data.activeVehicles, name: "Active", itemStyle: { color: "#22c55e" } },
          { value: data.totalVehicles - data.activeVehicles, name: "Inactive", itemStyle: { color: "#e5e7eb" } },
        ],
      }],
    });

    const tripsChart = echarts.init(tripsChartRef.current);
    tripsChart.setOption({
      title: { text: "Trip Activity", left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: ["Active", "Completed"] },
      yAxis: { type: "value" },
      series: [{
        type: "bar",
        data: [
          { value: data.activeTrips, itemStyle: { color: "#3b82f6" } },
          { value: data.completedTrips, itemStyle: { color: "#22c55e" } },
        ],
      }],
    });

    return () => { statusChart.dispose(); tripsChart.dispose(); };
  }, [data]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const res = await fetch(`/api/analytics/fleet?${params.toString()}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="p-8 text-center">Loading fleet analytics...</div>;
  if (!data) return <div className="p-8 text-center">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Analytics</h1>
        </div>
        <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} onApply={fetchData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Vehicles" value={data.totalVehicles} icon={Car} color="blue" subtitle={`${data.activeVehicles} active`} />
        <KPICard title="Utilization" value={`${data.vehicleUtilization}%`} icon={Clock} color="green" />
        <KPICard title="Availability" value={`${data.fleetAvailability}%`} icon={Car} color="purple" />
        <KPICard title="Downtime" value={`${data.vehicleDowntime}h`} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div ref={statusChartRef} className="w-full h-72" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div ref={tripsChartRef} className="w-full h-72" />
        </div>
      </div>
    </div>
  );
}
