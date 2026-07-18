'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, ChevronLeft, ChevronRight, SlidersHorizontal, CheckCircle, Clock, ArrowRightLeft, Ban, AlertTriangle, CalendarDays, History, Truck, User, MapPin } from 'lucide-react';

interface Assignment {
  id: string;
  assignmentType: string;
  assignedAt: string;
  endedAt?: string;
  notes?: string;
  isPrimary: boolean;
  vehicle: { id: string; registrationNumber: string; make: string; model: string; status: string; availability: string };
  driver: { id: string; firstName: string; lastName: string; email: string; phone?: string; status: string; employeeId?: string };
  branch?: { id: string; name: string };
  department?: { id: string; name: string };
}

const typeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  PRIMARY: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Primary' },
  TEMPORARY: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Temporary' },
  SUBSTITUTE: { icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Substitute' },
  TRAINING: { icon: AlertTriangle, color: 'text-teal-600', bg: 'bg-teal-50', label: 'Training' },
};

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  ACTIVE: { color: 'text-green-600', bg: 'bg-green-50', label: 'Active' },
  INACTIVE: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Inactive' },
  SUSPENDED: { color: 'text-red-600', bg: 'bg-red-50', label: 'Suspended' },
  ON_LEAVE: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'On Leave' },
  TERMINATED: { color: 'text-red-700', bg: 'bg-red-100', label: 'Terminated' },
  PENDING: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const router = useRouter();

  useEffect(() => { fetchAssignments(); fetchFilters(); }, [page, filters]);

  const fetchAssignments = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24' });
      if (search) params.set('q', search);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`/api/assignments?${params}`);
      const data = await res.json();
      if (data.success) { setAssignments(data.data.assignments); setTotalPages(data.data.totalPages); }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const fetchFilters = async () => {
    try { const res = await fetch('/api/assignments/filters'); const data = await res.json(); if (data.success) setFilterOptions(data.data); }
    catch (error) { console.error(error); }
  };

  const handleEnd = async (id: string) => {
    if (!confirm('End this assignment?')) return;
    try { const res = await fetch(`/api/assignments/${id}/end`, { method: 'POST' }); if (res.ok) fetchAssignments(); }
    catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    try { const res = await fetch(`/api/assignments/${id}`, { method: 'DELETE' }); if (res.ok) fetchAssignments(); }
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
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">Manage vehicle-driver assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/assignments/history" className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <History className="w-4 h-4" />History
          </Link>
          <Link href="/dashboard/assignments/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />New Assignment
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by driver, vehicle, registration..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchAssignments()} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => setFilterOpen(!filterOpen)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <SlidersHorizontal className="w-4 h-4" />Filters
        </button>
      </div>

      {filterOpen && filterOptions && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={filters.assignmentType || ''} onChange={(e) => setFilters({ ...filters, assignmentType: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Types</option>
            {filterOptions.assignmentTypes?.map((s: string) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.branchId || ''} onChange={(e) => setFilters({ ...filters, branchId: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Branches</option>
            {filterOptions.branches?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={filters.departmentId || ''} onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Departments</option>
            {filterOptions.departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button onClick={() => setFilters({})} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Clear Filters</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assignments.map((a) => {
                const tcfg = typeConfig[a.assignmentType] || typeConfig.PRIMARY;
                const TypeIcon = tcfg.icon;
                const dcfg = statusConfig[a.driver.status] || statusConfig.PENDING;
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{a.vehicle.registrationNumber}</p>
                          <p className="text-sm text-gray-500">{a.vehicle.make} {a.vehicle.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium text-sm">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{a.driver.firstName} {a.driver.lastName}</p>
                          <p className="text-sm text-gray-500">{a.driver.employeeId || a.driver.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${tcfg.bg} ${tcfg.color}`}>
                        <TypeIcon className="w-3 h-3" />{tcfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.branch ? (
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />{a.branch.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(a.assignedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEnd(a.id)} className="px-3 py-1.5 text-sm bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100">End</button>
                        <button onClick={() => handleDelete(a.id)} className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No active assignments found
                  </td>
                </tr>
              )}
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
