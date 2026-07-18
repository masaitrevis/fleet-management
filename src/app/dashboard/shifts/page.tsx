'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, ChevronLeft, ChevronRight, SlidersHorizontal, Sun, Moon, SplitSquareHorizontal, CalendarDays, Calendar, CheckCircle, Clock, Ban, ArrowRightLeft, AlertTriangle, Trash2, Pencil } from 'lucide-react';

interface Shift {
  id: string;
  name: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  daysOfWeek: number[];
  isActive: boolean;
  notes?: string;
}

const typeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  DAY: { icon: Sun, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Day' },
  NIGHT: { icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Night' },
  SPLIT: { icon: SplitSquareHorizontal, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Split' },
  WEEKEND: { icon: CalendarDays, color: 'text-green-600', bg: 'bg-green-50', label: 'Weekend' },
  HOLIDAY: { icon: Calendar, color: 'text-red-600', bg: 'bg-red-50', label: 'Holiday' },
  CUSTOM: { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Custom' },
};

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ShiftsPage() {
  const router = useRouter();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => { fetchShifts(); }, [page, filters, search]);

  const fetchShifts = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24' });
      if (search) params.set('q', search);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`/api/shifts?${params}`);
      const data = await res.json();
      if (data.success) { setShifts(data.data.shifts); setTotalPages(data.data.totalPages); }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this shift?')) return;
    try { const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' }); if (res.ok) fetchShifts(); }
    catch (error) { console.error(error); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/shifts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) fetchShifts();
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
          <h1 className="text-2xl font-bold text-gray-900">Shifts</h1>
          <p className="text-gray-600 mt-1">Manage driver shift schedules</p>
        </div>
        <Link href="/dashboard/shifts/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />New Shift
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search shifts..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchShifts()} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => setFilterOpen(!filterOpen)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <SlidersHorizontal className="w-4 h-4" />Filters
        </button>
      </div>

      {filterOpen && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={filters.shiftType || ''} onChange={(e) => setFilters({ ...filters, shiftType: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Types</option>
            <option value="DAY">Day</option>
            <option value="NIGHT">Night</option>
            <option value="SPLIT">Split</option>
            <option value="WEEKEND">Weekend</option>
            <option value="HOLIDAY">Holiday</option>
            <option value="CUSTOM">Custom</option>
          </select>
          <select value={filters.isActive || ''} onChange={(e) => setFilters({ ...filters, isActive: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button onClick={() => setFilters({})} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Clear Filters</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts.map((shift) => {
          const tcfg = typeConfig[shift.shiftType] || typeConfig.CUSTOM;
          const TypeIcon = tcfg.icon;
          return (
            <div key={shift.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${tcfg.bg} flex items-center justify-center ${tcfg.color}`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{shift.name}</p>
                    <p className="text-sm text-gray-500">{tcfg.label} Shift</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(shift.id, shift.isActive)}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${shift.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  {shift.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Time</span>
                  <span className="font-medium text-gray-900">{shift.startTime} — {shift.endTime}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Break</span>
                  <span className="font-medium text-gray-900">{shift.breakMinutes} min</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Days</span>
                  <span className="font-medium text-gray-900">
                    {shift.daysOfWeek.map((d) => dayNames[d]).join(', ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => router.push(`/dashboard/shifts/${shift.id}/edit`)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <Pencil className="w-3.5 h-3.5" />Edit
                </button>
                <button
                  onClick={() => handleDelete(shift.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />Delete
                </button>
              </div>
            </div>
          );
        })}
        {shifts.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No shifts found
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
