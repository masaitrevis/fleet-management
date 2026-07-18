'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Route, MapPin, Clock, ChevronLeft, ChevronRight,
  SlidersHorizontal, CheckCircle, AlertTriangle, ArrowRight
} from 'lucide-react';

interface RouteItem {
  id: string;
  name: string;
  description?: string;
  startLocation: string;
  endLocation: string;
  distance?: number;
  estimatedDuration?: number;
  isActive: boolean;
  isOptimized: boolean;
  routeStops: { id: string; name: string; stopType: string }[];
  _count?: { trips: number };
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => { fetchRoutes(); }, [page, filters]);

  const fetchRoutes = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24' });
      if (search) params.set('q', search);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`/api/routes?${params}`);
      const data = await res.json();
      if (data.success) { setRoutes(data.data.routes); setTotalPages(data.data.totalPages); }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this route?')) return;
    try { const res = await fetch(`/api/routes/${id}`, { method: 'DELETE' }); if (res.ok) fetchRoutes(); }
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
          <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
          <p className="text-gray-600 mt-1">Manage your fleet routes and waypoints</p>
        </div>
        <Link href="/dashboard/routes/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />New Route
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name, location..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchRoutes()} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => setFilterOpen(!filterOpen)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <SlidersHorizontal className="w-4 h-4" />Filters
        </button>
      </div>

      {filterOpen && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={filters.isActive || ''} onChange={(e) => setFilters({ ...filters, isActive: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button onClick={() => setFilters({})} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Clear Filters</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{r.name}</h3>
                  {r.description && <p className="text-sm text-gray-500 mt-1">{r.description}</p>}
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {r.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{r.startLocation}</span>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <span>{r.endLocation}</span>
                </div>
                {r.distance && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Route className="w-4 h-4 text-gray-400" />
                    {r.distance} km
                  </div>
                )}
                {r.estimatedDuration && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {r.estimatedDuration} min
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-500">
                  <span>{r.routeStops.length} stops</span>
                  <span>·</span>
                  <span>{r._count?.trips || 0} trips</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/dashboard/routes/${r.id}`} className="flex-1 text-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">View</Link>
                <Link href={`/dashboard/routes/${r.id}/edit`} className="flex-1 text-center px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100">Edit</Link>
                <button onClick={() => handleDelete(r.id)} className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Delete</button>
              </div>
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
