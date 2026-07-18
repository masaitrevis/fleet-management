'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, AlertTriangle, CheckCircle, XCircle, Clock, Shield, AlertOctagon, Filter, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface Alert {
  id: string;
  alertType: string;
  severity: string;
  status: string;
  message?: string;
  value?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  createdAt: string;
  vehicle?: { id: string; registrationNumber: string; make: string; model: string };
  driver?: { id: string; firstName: string; lastName: string };
}

const severityConfig: Record<string, { color: string; bg: string; label: string }> = {
  LOW: { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Low' },
  MEDIUM: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Medium' },
  HIGH: { color: 'text-orange-600', bg: 'bg-orange-50', label: 'High' },
  CRITICAL: { color: 'text-red-600', bg: 'bg-red-50', label: 'Critical' },
};

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  ACTIVE: { color: 'text-red-600', bg: 'bg-red-50', label: 'Active' },
  ACKNOWLEDGED: { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Acknowledged' },
  RESOLVED: { color: 'text-green-600', bg: 'bg-green-50', label: 'Resolved' },
  DISMISSED: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Dismissed' },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const router = useRouter();

  useEffect(() => { fetchAlerts(); }, [page, filters]);

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (search) params.set('q', search);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`/api/alerts?${params}`);
      const data = await res.json();
      if (data.success) { setAlerts(data.data.alerts); setTotalPages(data.data.totalPages); }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleAcknowledge = async (id: string) => {
    try { const res = await fetch(`/api/alerts/${id}/acknowledge`, { method: 'POST' }); if (res.ok) fetchAlerts(); }
    catch (error) { console.error(error); }
  };

  const handleResolve = async (id: string) => {
    try { const res = await fetch(`/api/alerts/${id}/resolve`, { method: 'POST', body: JSON.stringify({}) }); if (res.ok) fetchAlerts(); }
    catch (error) { console.error(error); }
  };

  const handleDismiss = async (id: string) => {
    try { const res = await fetch(`/api/alerts/${id}/dismiss`, { method: 'POST' }); if (res.ok) fetchAlerts(); }
    catch (error) { console.error(error); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alert Center</h1>
          <p className="text-gray-600 mt-1">Monitor and manage fleet alerts</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search alerts..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchAlerts()} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => setFilterOpen(!filterOpen)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <SlidersHorizontal className="w-4 h-4" />Filters
        </button>
      </div>

      {filterOpen && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={filters.severity || ''} onChange={(e) => setFilters({ ...filters, severity: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select value={filters.status || ''} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
          <select value={filters.alertType || ''} onChange={(e) => setFilters({ ...filters, alertType: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Types</option>
            <option value="OVERSPEED">Overspeed</option>
            <option value="OFFLINE">Offline</option>
            <option value="LOW_BATTERY">Low Battery</option>
            <option value="IDLE">Idle</option>
            <option value="UNAUTHORIZED_MOVEMENT">Unauthorized Movement</option>
            <option value="ROUTE_DEVIATION">Route Deviation</option>
            <option value="EMERGENCY_SOS">Emergency SOS</option>
            <option value="GEOFENCE_ENTER">Geofence Enter</option>
            <option value="GEOFENCE_EXIT">Geofence Exit</option>
          </select>
          <button onClick={() => setFilters({})} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Clear Filters</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Vehicle</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Severity</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Message</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Time</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alerts.map((a) => {
                const sev = severityConfig[a.severity] || severityConfig.MEDIUM;
                const stat = statusConfig[a.status] || statusConfig.ACTIVE;
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{a.alertType}</span>
                    </td>
                    <td className="px-4 py-3">{a.vehicle?.registrationNumber || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${sev.bg} ${sev.color}`}>{sev.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stat.bg} ${stat.color}`}>{stat.label}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">{a.message || a.value || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {a.status === 'ACTIVE' && (
                          <>
                            <button onClick={() => handleAcknowledge(a.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Acknowledge"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => handleResolve(a.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="Resolve"><Shield className="w-4 h-4" /></button>
                          </>
                        )}
                        {a.status === 'ACKNOWLEDGED' && (
                          <button onClick={() => handleResolve(a.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="Resolve"><Shield className="w-4 h-4" /></button>
                        )}
                        {(a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED') && (
                          <button onClick={() => handleDismiss(a.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600" title="Dismiss"><XCircle className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {alerts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p>No alerts found</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-300 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-300 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
