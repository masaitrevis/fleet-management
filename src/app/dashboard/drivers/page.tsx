'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, User, MapPin, Car, Phone, Mail, ChevronLeft, ChevronRight, SlidersHorizontal, CheckCircle, Ban, AlertTriangle, Calendar, Clock } from 'lucide-react';

interface License {
  id: string;
  licenseNumber: string;
  licenseClass?: string;
  expiryDate?: string;
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: string;
  employeeId?: string;
  licenses: License[];
  currentVehicles: { id: string; registrationNumber: string; make: string; model: string }[];
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  ACTIVE: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Active' },
  INACTIVE: { icon: Ban, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Inactive' },
  SUSPENDED: { icon: Ban, color: 'text-red-600', bg: 'bg-red-50', label: 'Suspended' },
  ON_LEAVE: { icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', label: 'On Leave' },
  TERMINATED: { icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-100', label: 'Terminated' },
  PENDING: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filterOptions, setFilterOptions] = useState<any>(null);

  useEffect(() => { fetchDrivers(); fetchFilters(); }, [page, filters]);

  const fetchDrivers = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24' });
      if (search) params.set('q', search);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`/api/drivers?${params}`);
      const data = await res.json();
      if (data.success) { setDrivers(data.data.drivers); setTotalPages(data.data.totalPages); }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const fetchFilters = async () => {
    try { const res = await fetch('/api/drivers/filters'); const data = await res.json(); if (data.success) setFilterOptions(data.data); }
    catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this driver?')) return;
    try { const res = await fetch(`/api/drivers/${id}`, { method: 'DELETE' }); if (res.ok) fetchDrivers(); }
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
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-600 mt-1">Manage your fleet drivers</p>
        </div>
        <Link href="/dashboard/drivers/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />Add Driver
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name, employee ID..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchDrivers()} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
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
          <select value={filters.licenseClass || ''} onChange={(e) => setFilters({ ...filters, licenseClass: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All License Classes</option>
            {filterOptions.licenseClasses?.filter(Boolean).map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setFilters({})} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Clear Filters</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Vehicle</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {drivers.map((driver) => {
                const cfg = statusConfig[driver.status] || statusConfig.INACTIVE;
                const StatusIcon = cfg.icon;
                const primaryLicense = driver.licenses?.[0];
                const currentVehicle = driver.currentVehicles?.[0];
                return (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm">
                          {driver.firstName[0]}{driver.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{driver.firstName} {driver.lastName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {driver.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{driver.email}</span>}
                            {driver.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{driver.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{primaryLicense?.licenseNumber || '—'}</p>
                        {primaryLicense?.licenseClass && <p className="text-gray-500">Class {primaryLicense.licenseClass}</p>}
                        {primaryLicense?.expiryDate && new Date(primaryLicense.expiryDate) < new Date() && <span className="inline-flex items-center px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">Expired</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {currentVehicle ? (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Car className="w-3 h-3" />
                          {currentVehicle.registrationNumber}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/drivers/${driver.id}`} className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">View</Link>
                        <Link href={`/dashboard/drivers/${driver.id}/edit`} className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100">Edit</Link>
                        <button onClick={() => handleDelete(driver.id)} className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Delete</button>
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
