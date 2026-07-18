'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Fuel } from 'lucide-react';
import FuelDashboardCards from '@/components/fuel/FuelDashboardCards';
import FuelLogTable from '@/components/fuel/FuelLogTable';
import FuelSearchFilters from '@/components/fuel/FuelSearchFilters';
import FuelPagination from '@/components/fuel/FuelPagination';
import FraudAlertTable from '@/components/fuel/FraudAlertTable';

export default function FuelDashboardPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalFuelConsumed: 0,
    totalFuelCost: 0,
    avgConsumption: 0,
    activeFraudAlerts: 0,
  });
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuel Management</h1>
          <p className="text-gray-600 mt-1">Track fuel usage, costs, and efficiency</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/fuel/logs/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Fuel Log
          </button>
        </div>
      </div>

      <FuelDashboardCards {...stats} />

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Fuel Logs</h2>
          <button
            onClick={() => router.push('/fuel/logs')}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all →
          </button>
        </div>
        <FuelLogTable logs={logs} />
      </div>

      {alerts.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Fraud Alerts</h2>
            <button
              onClick={() => router.push('/fuel/fraud')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all →
            </button>
          </div>
          <FraudAlertTable alerts={alerts} />
        </div>
      )}
    </div>
  );
}
