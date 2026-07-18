'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Trash2, AlertTriangle, Circle, Map, CheckCircle, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface Geofence {
  id: string;
  name: string;
  description?: string;
  type: string;
  isActive: boolean;
  alertType: string;
  speedLimit?: number;
  radius?: number;
  vehicles: string[];
}

export default function GeofencesPage() {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const router = useRouter();

  useEffect(() => { fetchGeofences(); }, [page, filters]);

  const fetchGeofences = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24' });
      if (search) params.set('q', search);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`/api/geofences?${params}`);
      const data = await res.json();
      if (data.success) { setGeofences(data.data.geofences); setTotalPages(data.data.totalPages); }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this geofence?')) return;
    try { const res = await fetch(`/api/geofences/${id}`, { method: 'DELETE' }); if (res.ok) fetchGeofences(); }
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
          <h1 className="text-2xl font-bold text-gray-900">Geofences</h1>
          <p className="text-gray-600 mt-1">Manage location-based alerts</p>
        </div>
        <Link href="/dashboard/geofences/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />Add Geofence
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search geofences..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchGeofences()} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => setFilterOpen(!filterOpen)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <SlidersHorizontal className="w-4 h-4" />Filters
        </button>
      </div>

      {filterOpen && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={filters.type || ''} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Types</option>
            <option value="CIRCLE">Circle</option>
            <option value="POLYGON">Polygon</option>
            <option value="POLYLINE">Polyline</option>
          </select>
          <select value={filters.isActive || ''} onChange={(e) => setFilters({ ...filters, isActive: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button onClick={() => setFilters({})} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Clear Filters</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {geofences.map((g) => (
          <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-gray-900">{g.name}</span>
              </div>
              {g.isActive ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">Active</span>
              ) : (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Inactive</span>
              )}
            </div>
            <div className="text-sm text-gray-600 space-y-1 mb-3">
              {g.description && <p>{g.description}</p>}
              <p>Type: {g.type}</p>
              {g.radius && <p>Radius: {g.radius}m</p>}
              {g.speedLimit && <p>Speed limit: {g.speedLimit} km/h</p>}
              <p>Alert: {g.alertType}</p>
              <p>Vehicles: {g.vehicles.length > 0 ? g.vehicles.length : 'All'}</p>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <Link href={`/dashboard/geofences/${g.id}`} className="flex-1 text-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">View</Link>
              <button onClick={() => handleDelete(g.id)} className="flex-1 text-center px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Delete</button>
            </div>
          </div>
        ))}
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
