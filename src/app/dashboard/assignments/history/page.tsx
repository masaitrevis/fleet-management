'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, ChevronLeft, ChevronRight, CalendarDays, Clock, CheckCircle, ArrowRightLeft, AlertTriangle, Truck, User, MapPin } from 'lucide-react';

interface HistoryItem {
  id: string;
  assignmentType: string;
  assignedAt: string;
  endedAt: string;
  notes?: string;
  vehicle: { id: string; registrationNumber: string; make: string; model: string };
  driver: { id: string; firstName: string; lastName: string; email: string };
  branch?: { id: string; name: string };
}

const typeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  PRIMARY: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Primary' },
  TEMPORARY: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Temporary' },
  SUBSTITUTE: { icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Substitute' },
  TRAINING: { icon: AlertTriangle, color: 'text-teal-600', bg: 'bg-teal-50', label: 'Training' },
};

export default function AssignmentHistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchDriverId, setSearchDriverId] = useState('');
  const [searchVehicleId, setSearchVehicleId] = useState('');

  useEffect(() => { fetchHistory(); }, [page, searchDriverId, searchVehicleId]);

  const fetchHistory = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24' });
      if (searchDriverId) params.set('driverId', searchDriverId);
      if (searchVehicleId) params.set('vehicleId', searchVehicleId);
      const res = await fetch(`/api/assignments/history?${params}`);
      const data = await res.json();
      if (data.success) { setHistory(data.data.assignments); setTotalPages(Math.ceil(data.data.total / 24)); }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/assignments" className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assignment History</h1>
            <p className="text-gray-600 mt-1">View ended assignments</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Filter by driver ID..." value={searchDriverId} onChange={(e) => setSearchDriverId(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Filter by vehicle ID..." value={searchVehicleId} onChange={(e) => setSearchVehicleId(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ended</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.map((a) => {
                const tcfg = typeConfig[a.assignmentType] || typeConfig.PRIMARY;
                const TypeIcon = tcfg.icon;
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
                        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{a.driver.firstName} {a.driver.lastName}</p>
                          <p className="text-sm text-gray-500">{a.driver.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${tcfg.bg} ${tcfg.color}`}>
                        <TypeIcon className="w-3 h-3" />{tcfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(a.assignedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(a.endedAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No ended assignments found
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
