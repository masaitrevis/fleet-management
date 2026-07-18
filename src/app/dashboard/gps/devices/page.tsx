'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, CheckCircle, XCircle, Pause, AlertTriangle, Trash2, Radio, Battery, Signal, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface GPSDevice {
  id: string;
  deviceId: string;
  serialNumber?: string;
  imei?: string;
  manufacturer?: string;
  model?: string;
  status: string;
  batteryLevel?: number;
  signalStrength?: number;
  networkType?: string;
  lastSeenAt?: string;
  vehicle?: { id: string; registrationNumber: string; make: string; model: string }[];
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  ACTIVE: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Active' },
  INACTIVE: { icon: Pause, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Inactive' },
  OFFLINE: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Offline' },
  SUSPENDED: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', label: 'Suspended' },
  DECOMMISSIONED: { icon: Trash2, color: 'text-red-700', bg: 'bg-red-100', label: 'Decommissioned' },
};

export default function GPSDevicesPage() {
  const [devices, setDevices] = useState<GPSDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const router = useRouter();

  useEffect(() => { fetchDevices(); fetchFilters(); }, [page, filters]);

  const fetchDevices = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24' });
      if (search) params.set('q', search);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`/api/gps/devices?${params}`);
      const data = await res.json();
      if (data.success) { setDevices(data.data.devices); setTotalPages(data.data.totalPages); }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const fetchFilters = async () => {
    try { const res = await fetch('/api/gps/devices/filters'); const data = await res.json(); if (data.success) setFilterOptions(data.data); }
    catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this GPS device?')) return;
    try { const res = await fetch(`/api/gps/devices/${id}`, { method: 'DELETE' }); if (res.ok) fetchDevices(); }
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
          <h1 className="text-2xl font-bold text-gray-900">GPS Devices</h1>
          <p className="text-gray-600 mt-1">Manage GPS tracking devices</p>
        </div>
        <Link href="/dashboard/gps/devices/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />Add Device
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by device ID, IMEI, serial..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchDevices()} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => setFilterOpen(!filterOpen)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <SlidersHorizontal className="w-4 h-4" />Filters
        </button>
      </div>

      {filterOpen && filterOptions && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={filters.status || ''} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Statuses</option>
            {filterOptions.statuses?.map((s: string) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.manufacturer || ''} onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Manufacturers</option>
            {filterOptions.manufacturers?.map((m: string) => <option key={m} value={m}>{m}</option>)}
          </select>
          <button onClick={() => setFilters({})} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Clear Filters</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {devices.map((d) => {
          const cfg = statusConfig[d.status] || statusConfig.OFFLINE;
          const Icon = cfg.icon;
          return (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-gray-900">{d.deviceId}</span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                  <Icon className="w-3 h-3" />{cfg.label}
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {d.imei && <p>IMEI: {d.imei}</p>}
                {d.manufacturer && <p>{d.manufacturer} {d.model}</p>}
                {d.batteryLevel != null && <p className="flex items-center gap-1"><Battery className="w-3 h-3" />{d.batteryLevel}%</p>}
                {d.signalStrength != null && <p className="flex items-center gap-1"><Signal className="w-3 h-3" />{d.signalStrength}%</p>}
                {d.vehicle?.[0] && <p>Vehicle: {d.vehicle[0].registrationNumber}</p>}
                {d.lastSeenAt && <p>Last seen: {new Date(d.lastSeenAt).toLocaleString()}</p>}
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                <button onClick={() => handleDelete(d.id)} className="flex-1 text-center px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Delete</button>
              </div>
            </div>
          );
        })}
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
