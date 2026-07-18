'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, MapPin, Truck, User, Calendar, Clock,
  ChevronLeft, ChevronRight, SlidersHorizontal, CheckCircle,
  Play, Pause, AlertTriangle, XCircle, Ban, Route, Flag,
  ArrowRight
} from 'lucide-react';

interface Trip {
  id: string;
  tripNumber: string;
  title: string;
  status: string;
  priority: string;
  startTime?: string;
  estimatedEndTime?: string;
  vehicle: { id: string; registrationNumber: string; make: string; model: string };
  driver: { id: string; firstName: string; lastName: string };
  route?: { id: string; name: string };
  _count?: { tripStops: number; tripCargos: number };
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  PLANNED: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Planned' },
  SCHEDULED: { icon: Calendar, color: 'text-cyan-600', bg: 'bg-cyan-50', label: 'Scheduled' },
  ASSIGNED: { icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Assigned' },
  IN_PROGRESS: { icon: Play, color: 'text-green-600', bg: 'bg-green-50', label: 'In Progress' },
  COMPLETED: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Completed' },
  CANCELLED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Cancelled' },
  DELAYED: { icon: Pause, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Delayed' },
  NO_SHOW: { icon: Ban, color: 'text-gray-600', bg: 'bg-gray-100', label: 'No Show' },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  LOW: { color: 'text-gray-500', label: 'Low' },
  NORMAL: { color: 'text-blue-500', label: 'Normal' },
  HIGH: { color: 'text-amber-500', label: 'High' },
  URGENT: { color: 'text-red-500', label: 'Urgent' },
};

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const router = useRouter();

  useEffect(() => { fetchTrips(); fetchFilters(); }, [page, filters]);

  const fetchTrips = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24' });
      if (search) params.set('q', search);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`/api/trips?${params}`);
      const data = await res.json();
      if (data.success) { setTrips(data.data.trips); setTotalPages(data.data.totalPages); }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const fetchFilters = async () => {
    try { const res = await fetch('/api/trips/filters'); const data = await res.json(); if (data.success) setFilterOptions(data.data); }
    catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trip?')) return;
    try { const res = await fetch(`/api/trips/${id}`, { method: 'DELETE' }); if (res.ok) fetchTrips(); }
    catch (error) { console.error(error); }
  };

  const handleStart = async (id: string) => {
    try {
      const res = await fetch(`/api/trips/${id}/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (res.ok) fetchTrips();
      else { const data = await res.json(); alert(data.error?.message || 'Failed to start trip'); }
    } catch (error) { console.error(error); }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;
    try {
      const res = await fetch(`/api/trips/${id}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cancellationReason: reason }) });
      if (res.ok) fetchTrips();
    } catch (error) { console.error(error); }
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
          <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
          <p className="text-gray-600 mt-1">Manage your fleet trips and routes</p>
        </div>
        <Link href="/dashboard/trips/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />New Trip
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by trip number, title..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchTrips()} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => setFilterOpen(!filterOpen)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <SlidersHorizontal className="w-4 h-4" />Filters
        </button>
      </div>

      {filterOpen && filterOptions && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={filters.status || ''} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Statuses</option>
            {filterOptions.statuses?.map((s: string) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.priority || ''} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Priorities</option>
            {filterOptions.priorities?.filter(Boolean).map((p: string) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.vehicleId || ''} onChange={(e) => setFilters({ ...filters, vehicleId: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Vehicles</option>
            {filterOptions.vehicles?.map((v: any) => <option key={v.id} value={v.id}>{v.registrationNumber}</option>)}
          </select>
          <select value={filters.driverId || ''} onChange={(e) => setFilters({ ...filters, driverId: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Drivers</option>
            {filterOptions.drivers?.map((d: any) => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
          </select>
          <button onClick={() => setFilters({})} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Clear Filters</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle / Driver</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trips.map((trip) => {
                const cfg = statusConfig[trip.status] || statusConfig.PLANNED;
                const StatusIcon = cfg.icon;
                const priCfg = priorityConfig[trip.priority || 'NORMAL'] || priorityConfig.NORMAL;
                return (
                  <tr key={trip.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{trip.title}</p>
                        <p className="text-xs text-gray-500">{trip.tripNumber}</p>
                        <span className={`text-xs font-medium ${priCfg.color}`}>{priCfg.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Truck className="w-3 h-3" />
                          {trip.vehicle?.registrationNumber || '—'}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <User className="w-3 h-3" />
                          {trip.driver?.firstName} {trip.driver?.lastName}
                        </div>
                        {trip.route && <div className="flex items-center gap-1 text-gray-500"><Route className="w-3 h-3" />{trip.route.name}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {trip.startTime ? new Date(trip.startTime).toLocaleDateString() : '—'}
                      {trip.estimatedEndTime && (
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <ArrowRight className="w-3 h-3" />
                          {new Date(trip.estimatedEndTime).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {trip.status === 'ASSIGNED' && (
                          <button onClick={() => handleStart(trip.id)} className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100">Start</button>
                        )}
                        {trip.status === 'IN_PROGRESS' && (
                          <button onClick={() => handleCancel(trip.id)} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Cancel</button>
                        )}
                        <Link href={`/dashboard/trips/${trip.id}`} className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">View</Link>
                        <Link href={`/dashboard/trips/${trip.id}/edit`} className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100">Edit</Link>
                        <button onClick={() => handleDelete(trip.id)} className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
