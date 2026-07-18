"use client";

import { useEffect, useState, useRef } from "react";
import * as echarts from "echarts";
import { KPICard } from "@/components/analytics/KPICard";
import { TrendIndicator } from "@/components/analytics/TrendIndicator";
import { DateRangeFilter } from "@/components/analytics/DateRangeFilter";
import { BarChart3, Users, Fuel, Wrench, Shield, DollarSign, Car } from "lucide-react";

interface DashboardData {
  fleet: {
    totalVehicles: number;
    activeVehicles: number;
    vehicleUtilization: number;
    fleetAvailability: number;
    activeTrips: number;
    completedTrips: number;
  };
  driver: {
    totalDrivers: number;
    activeDrivers: number;
    driverUtilization: number;
    safetyScore: number;
    drivingHours: number;
  };
  fuel: {
    totalConsumption: number;
    totalCost: number;
    costPerKm: number;
    avgEfficiency: number;
    fraudAlerts: number;
  };
  maintenance: {
    totalCost: number;
    vehiclesDueService: number;
    avgRepairCost: number;
    downtime: number;
  };
  compliance: {
    complianceScore: number;
    expiringDocuments: number;
    inspectionPassRate: number;
    violations: number;
  };
  financial: {
    operatingCost: number;
    maintenanceCost: number;
    fuelCost: number;
    costPerVehicle: number;
  };
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const fleetChartRef = useRef<HTMLDivElement>(null);
  const fuelChartRef = useRef<HTMLDivElement>(null);
  const costChartRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const res = await fetch(`/api/analytics/dashboard?${params.toString()}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  useEffect(() => {
    if (!data || !fleetChartRef.current || !fuelChartRef.current || !costChartRef.current) return;

    const fleetChart = echarts.init(fleetChartRef.current);
    fleetChart.setOption({
      title: { text: "Fleet Status", left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "item" },
      series: [{
        type: "pie",
        radius: ["40%", "70%"],
        data: [
          { value: data.fleet.activeVehicles, name: "Active", itemStyle: { color: "#22c55e" } },
          { value: data.fleet.totalVehicles - data.fleet.activeVehicles, name: "Inactive", itemStyle: { color: "#e5e7eb" } },
        ],
      }],
    });

    const fuelChart = echarts.init(fuelChartRef.current);
    fuelChart.setOption({
      title: { text: "Fuel Cost Breakdown", left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: ["Fuel", "Maintenance", "Other"] },
      yAxis: { type: "value" },
      series: [{
        type: "bar",
        data: [
          { value: data.fuel.totalCost, itemStyle: { color: "#3b82f6" } },
          { value: data.maintenance.totalCost, itemStyle: { color: "#f59e0b" } },
          { value: data.financial.operatingCost - data.fuel.totalCost - data.maintenance.totalCost, itemStyle: { color: "#8b5cf6" } },
        ],
      }],
    });

    const costChart = echarts.init(costChartRef.current);
    costChart.setOption({
      title: { text: "Operating Costs", left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: ["Operating", "Maintenance", "Fuel"] },
      yAxis: { type: "value" },
      series: [{
        type: "line",
        smooth: true,
        data: [data.financial.operatingCost, data.maintenance.totalCost, data.fuel.totalCost],
        itemStyle: { color: "#ef4444" },
        areaStyle: { color: "rgba(239, 68, 68, 0.1)" },
      }],
    });

    return () => { fleetChart.dispose(); fuelChart.dispose(); costChart.dispose(); };
  }, [data]);

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time fleet analytics and KPIs</p>
        </div>
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onApply={fetchData}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Vehicles"
          value={data.fleet.totalVehicles}
          icon={Car}
          color="blue"
          subtitle={`${data.fleet.activeVehicles} active`}
          trend={+2}
        />
        <KPICard
          title="Fleet Utilization"
          value={`${data.fleet.vehicleUtilization}%`}
          icon={BarChart3}
          color="green"
          subtitle={`${data.fleet.activeTrips} active trips`}
          trend={+5}
        />
        <KPICard
          title="Total Drivers"
          value={data.driver.totalDrivers}
          icon={Users}
          color="purple"
          subtitle={`${data.driver.activeDrivers} active`}
          trend={+1}
        />
        <KPICard
          title="Safety Score"
          value={`${data.driver.safetyScore}`}
          icon={Shield}
          color="amber"
          subtitle={`${data.compliance.violations} violations`}
          trend={-3}
        />
        <KPICard
          title="Fuel Cost"
          value={`KES ${data.fuel.totalCost.toLocaleString()}`}
          icon={Fuel}
          color="red"
          subtitle={`${data.fuel.avgEfficiency} km/L avg`}
          trend={+8}
        />
        <KPICard
          title="Maintenance Cost"
          value={`KES ${data.maintenance.totalCost.toLocaleString()}`}
          icon={Wrench}
          color="orange"
          subtitle={`${data.maintenance.vehiclesDueService} due for service`}
          trend={+4}
        />
        <KPICard
          title="Operating Cost"
          value={`KES ${data.financial.operatingCost.toLocaleString()}`}
          icon={DollarSign}
          color="teal"
          subtitle={`KES ${data.financial.costPerVehicle} per vehicle`}
          trend={+6}
        />
        <KPICard
          title="Compliance Score"
          value={`${data.compliance.complianceScore}%`}
          icon={Shield}
          color="indigo"
          subtitle={`${data.compliance.expiringDocuments} docs expiring`}
          trend={+1}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div ref={fleetChartRef} className="w-full h-64" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div ref={fuelChartRef} className="w-full h-64" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div ref={costChartRef} className="w-full h-64" />
        </div>
      </div>
    </div>
  );
}
