'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Shield } from 'lucide-react';
import FraudAlertTable from '@/components/fuel/FraudAlertTable';

export default function FuelFraudPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ open: 0, investigating: 0, confirmed: 0, falsePositive: 0 });
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const [alertsRes, statsRes] = await Promise.all([
        fetch('/api/fuel/fraud'),
        fetch('/api/fuel/fraud/stats'),
      ]);
      const alertsData = await alertsRes.json();
      const statsData = await statsRes.json();
      if (alertsData.success) setAlerts(alertsData.data.alerts || []);
      if (statsData.success) setStats(statsData.data || {});
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/fuel/fraud/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchAlerts();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fraud Alerts</h1>
          <p className="text-gray-600 mt-1">Monitor and investigate suspicious fuel activity</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Open</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm">Investigating</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.investigating}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm">Confirmed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-sm">False Positive</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.falsePositive}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <FraudAlertTable alerts={alerts} onUpdateStatus={handleUpdateStatus} />
      )}
    </div>
  );
}
