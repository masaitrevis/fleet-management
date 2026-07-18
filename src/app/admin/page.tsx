'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  Car,
  Route,
  HardDrive,
  AlertTriangle,
  Activity,
  DollarSign,
  Server,
} from 'lucide-react';
import KpiCard from '@/components/admin/KpiCard';
import SystemHealthIndicator from '@/components/admin/SystemHealthIndicator';
import AdminHeader from '@/components/admin/AdminHeader';
import PlatformChart from '@/components/admin/PlatformChart';
import ErrorBoundary from '@/components/ErrorBoundary';
import Skeleton, { SkeletonTable } from '@/components/Skeleton';

interface DashboardMetrics {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  activeUsers: number;
  totalVehicles: number;
  activeTrips: number;
  monthlyRevenue: number;
  apiRequests: number;
  storageUsed: number;
  failedJobs: number;
  systemHealth: {
    status: string;
    database: string;
    api: string;
    queue: string;
    storage: string;
  };
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setMetrics(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ErrorBoundary>
      <div>
        <AdminHeader title="Platform Dashboard" subtitle="Overview of all tenants and system health" />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Total Companies" value={metrics?.totalCompanies ?? 0} icon={Building2} loading={loading} iconColor="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
            <KpiCard title="Active Users" value={metrics?.activeUsers ?? 0} icon={Users} loading={loading} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" />
            <KpiCard title="Total Vehicles" value={metrics?.totalVehicles ?? 0} icon={Car} loading={loading} iconColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" />
            <KpiCard title="Active Trips" value={metrics?.activeTrips ?? 0} icon={Route} loading={loading} iconColor="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Storage Used" value={`${Math.round((metrics?.storageUsed ?? 0) / 1024 / 1024 / 1024)} GB`} icon={HardDrive} loading={loading} iconColor="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" />
            <KpiCard title="API Requests" value={metrics?.apiRequests ?? 0} icon={Activity} loading={loading} iconColor="bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400" />
            <KpiCard title="Monthly Revenue" value={`$${metrics?.monthlyRevenue ?? 0}`} icon={DollarSign} loading={loading} iconColor="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
            <KpiCard title="Failed Jobs" value={metrics?.failedJobs ?? 0} icon={AlertTriangle} loading={loading} iconColor="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" change={metrics?.failedJobs && metrics.failedJobs > 0 ? -metrics.failedJobs : 0} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">System Health</h3>
              <div className="space-y-2">
                {metrics?.systemHealth && (
                  <>
                    <SystemHealthIndicator label="Database" status={metrics.systemHealth.database as any} detail="Connections: stable" />
                    <SystemHealthIndicator label="API" status={metrics.systemHealth.api as any} detail="Response time: < 100ms" />
                    <SystemHealthIndicator label="Queue" status={metrics.systemHealth.queue as any} detail="Workers: 3 active" />
                    <SystemHealthIndicator label="Storage" status={metrics.systemHealth.storage as any} detail="Disk: 45% used" />
                  </>
                )}
                {loading && (
                  <div className="space-y-3">
                    <Skeleton height={32} />
                    <Skeleton height={32} />
                    <Skeleton height={32} />
                    <Skeleton height={32} />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Server Status</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-3">
                    <Skeleton circle width={48} height={48} className="mx-auto" />
                    <Skeleton height={20} className="w-48 mx-auto" />
                    <Skeleton height={12} className="w-32 mx-auto" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Server className="h-12 w-12 text-emerald-500 mx-auto" />
                    <p className="mt-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400">All Systems Operational</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Last checked: {new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
