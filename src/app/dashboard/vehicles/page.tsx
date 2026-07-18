'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, MapPin, User, Wrench, CheckCircle, AlertTriangle, XCircle, Ban, Truck, Bus, Car, Bike, HardHat, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year?: number;
  status: string;
  availability: string;
  category?: string;
  color?: string;
  fuelType?: string;
  odometer?: number;
  branch?: { name: string };
  currentDriver?: { firstName: string; lastName: string };
  images?: { url: string; isPrimary: boolean }[];
  _count?: { assignments: number };
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  ACTIVE: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Active' },
  IN_MAINTENANCE: { icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Maintenance' },
  RESERVED: { icon: AlertTriangle, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Reserved' },
  OUT_OF_SERVICE: { icon: Ban, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Out of Service' },
  SOLD: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Sold' },
  SCRAPPED: { icon: Ban, color: 'text-red-700', bg: 'bg-red-100', label: 'Scrapped' },
  STOLEN: { icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-100', label: 'Stolen' },
};

const categoryIcons: Record<string, any> = {
  TRUCK: Truck,
  BUS: Bus,
  VAN: Car,
  PICKUP: Truck,
  SUV: Car,
  SEDAN: Car,
  MOTORCYCLE: Bike,
  TRAILER: Truck,
  HEAVY_EQUIPMENT: HardHat,
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const router = useRouter();

  useEffect(() => { fetchVehicles(); fetchFilters(); }, [page, filters]);

  const fetchVehicles = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24' });
      if (search) params.set('q', search);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`/api/vehicles?${params}`);
      const data = await res.json();
      if (data.success) { setVehicles(data.data.vehicles); setTotalPages(data.data.totalPages); }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const fetchFilters = async () => {
    try { const res = await fetch('/api/vehicles/filters'); const data = await res.json(); if (data.success) setFilterOptions(data.data); }
    catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return;
    try { const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' }); if (res.ok) fetchVehicles(); }
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
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-gray-600 mt-1">Manage your fleet vehicles</p>
        </div>
        <Link href="/dashboard/vehicles/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />Add Vehicle
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by registration, make, model, VIN..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchVehicles()} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => setFilterOpen(!filterOpen)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <SlidersHorizontal className="w-4 h-4" />Filters
        </button>
      </div>

      {filterOpen && filterOptions && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <select value={filters.status || ''} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Statuses</option>
            {filterOptions.statuses?.map((s: string) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.category || ''} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Categories</option>
            {filterOptions.categories?.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.make || ''} onChange={(e) => setFilters({ ...filters, make: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Makes</option>
            {filterOptions.makes?.map((m: string) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filters.fuelType || ''} onChange={(e) => setFilters({ ...filters, fuelType: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Fuel Types</option>
            {filterOptions.fuelTypes?.map((f: string) => <option key={f} value={f}>{f}</option>)}
          </select>
          <button onClick={() => setFilters({})} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Clear Filters</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {vehicles.map((v) => {
          const cfg = statusConfig[v.status] || statusConfig.OUT_OF_SERVICE;
          const Icon = cfg.icon;
          const CatIcon = categoryIcons[v.category || 'SEDAN'] || Car;
          return (
            <div key={v.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="h-40 bg-gray-100 relative">
                {v.images?.length ? (
                  <img src={v.images.find(i => i.isPrimary)?.url || v.images[0].url} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <CatIcon className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                  <Icon className="w-3 h-3" />{cfg.label}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{v.registrationNumber}</p>
                    <p className="text-sm text-gray-600">{v.make} {v.model} {v.year ? `(${v.year})` : ''}</p>
                  </div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v.color || '#ccc' }} title={v.color || 'No color'} />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {v.branch && <span className="inline-flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3" />{v.branch.name}</span>}
                  {v.currentDriver && <span className="inline-flex items-center gap-1 text-xs text-gray-500"><User className="w-3 h-3" />{v.currentDriver.firstName} {v.currentDriver.lastName}</span>}
                  {v.fuelType && <span className="inline-flex items-center gap-1 text-xs text-gray-500">{v.fuelType}</span>}
                  {v.odometer !== undefined && <span className="inline-flex items-center gap-1 text-xs text-gray-500">{v.odometer.toLocaleString()} km</span>}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Link href={`/dashboard/vehicles/${v.id}`} className="flex-1 text-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">View</Link>
                  <Link href={`/dashboard/vehicles/${v.id}/edit`} className="flex-1 text-center px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100">Edit</Link>
                  <button onClick={() => handleDelete(v.id)} className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Delete</button>
                </div>
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
