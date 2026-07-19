'use client';

import { useEffect, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import SecurityAlertCard from '@/components/admin/SecurityAlertCard';
import DataTable from '@/components/admin/DataTable';

interface SecurityEvent {
  id: string;
  type: string;
  severity: string;
  ipAddress: string | null;
  details: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

interface DashboardData {
  totalEvents: number;
  unresolvedEvents: number;
  criticalEvents: number;
  failedLogins24h: number;
  rateLimitViolations24h: number;
  blockedIPs: number;
  recentEvents: SecurityEvent[];
}

export default function SecurityPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchData = () => {
    Promise.all([
      fetch('/api/admin/security').then((r) => r.json()),
      fetch(`/api/admin/security/events?page=${page}&limit=${limit}`).then((r) => r.json()),
    ]).then(([dashRes, eventsRes]) => {
      if (dashRes.success) setData(dashRes.data);
      if (eventsRes.success) setEvents(eventsRes.data.items);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleResolve = (id: string) => {
    fetch(`/api/admin/security/events/${id}/resolve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolvedBy: 'admin' }),
    }).then(() => fetchData());
  };

  const handleBlockIP = () => {
    const ip = prompt('Enter IP address to block:');
    if (!ip) return;
    fetch('/api/admin/security/ip-block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ipAddress: ip }),
    }).then(() => alert('IP blocked'));
  };

  return (
    <div>
      <AdminHeader title="Security Center" subtitle="Monitor threats and security events" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Events', value: data?.totalEvents ?? 0 },
            { label: 'Unresolved', value: data?.unresolvedEvents ?? 0 },
            { label: 'Critical', value: data?.criticalEvents ?? 0 },
            { label: 'Failed Logins (24h)', value: data?.failedLogins24h ?? 0 },
            { label: 'Rate Limit Hits', value: data?.rateLimitViolations24h ?? 0 },
            { label: 'Blocked IPs', value: data?.blockedIPs ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 Events</h3>
          <button onClick={handleBlockIP} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">
            Block IP
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <SecurityAlertCard
                key={event.id}
                type={event.type}
                severity={event.severity as any}
                details={event.details ?? undefined}
                ipAddress={event.ipAddress ?? undefined}
                createdAt={event.createdAt}
                resolved={!!event.resolvedAt}
                onResolve={event.resolvedAt ? undefined : () => handleResolve(event.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
