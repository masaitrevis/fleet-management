'use client';

import { useEffect, useState } from 'react';
import SystemHealthIndicator from '@/components/admin/SystemHealthIndicator';
import { Activity, Database, Zap, Clock, HardDrive, Server } from 'lucide-react';

interface Metrics {
  cpu: number;
  memory: number;
  disk: number;
  dbConnections: number;
  apiP95: number;
  cacheHitRate: number;
  queueDepth: number;
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    const demo: Metrics = { cpu: 34, memory: 72, disk: 56, dbConnections: 24, apiP95: 145, cacheHitRate: 94.2, queueDepth: 3 };
    setTimeout(() => setMetrics(demo), 400);
  }, []);

  const ProgressBar = ({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700
        <span className="ml-auto text-lg font-bold text-gray-900
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900
        <p className="text-sm text-gray-500 mt-1">Real-time system performance metrics</p>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics ? (
          <>
            <ProgressBar label="CPU Usage" value={metrics.cpu} color="bg-blue-600" icon={Activity} />
            <ProgressBar label="Memory Usage" value={metrics.memory} color="bg-amber-500" icon={Zap} />
            <ProgressBar label="Disk Usage" value={metrics.disk} color="bg-emerald-500" icon={HardDrive} />
          </>
        ) : (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-lg animate-pulse" />)
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DB & API */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Database & API</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700 Connections</span>
              </div>
              <span className="text-lg font-bold text-gray-900 ?? '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700 P95 Latency</span>
              </div>
              <span className="text-lg font-bold text-gray-900 ? `${metrics.apiP95}ms` : '-'}</span>
            </div>
            <SystemHealthIndicator label="Database" status="healthy" detail={`${metrics?.dbConnections ?? 0} conns`} />
            <SystemHealthIndicator label="API Gateway" status={metrics && metrics.apiP95 > 200 ? 'warning' : 'healthy'} detail={`${metrics?.apiP95 ?? 0}ms p95`} />
          </div>
        </div>

        {/* Cache & Queue */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Cache & Queue</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700 Hit Rate</span>
              </div>
              <span className="text-lg font-bold text-gray-900 ? `${metrics.cacheHitRate}%` : '-'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${metrics?.cacheHitRate ?? 0}%` }} />
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700 Depth</span>
              </div>
              <span className="text-lg font-bold text-gray-900 ?? '-'}</span>
            </div>
            <SystemHealthIndicator label="Cache" status="healthy" detail={`${metrics?.cacheHitRate ?? 0}% hit`} />
            <SystemHealthIndicator label="Queue" status={metrics && metrics.queueDepth > 10 ? 'warning' : 'healthy'} detail={`${metrics?.queueDepth ?? 0} pending`} />
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">API Response Time Trend</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300
          <p className="text-sm text-gray-400">Chart area — integrate with recharts/chart.js here</p>
        </div>
      </div>
    </div>
  );
}
