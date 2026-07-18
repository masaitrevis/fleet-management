'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import FuelLogTable from '@/components/fuel/FuelLogTable';
import FuelSearchFilters from '@/components/fuel/FuelSearchFilters';
import FuelPagination from '@/components/fuel/FuelPagination';

export default function FuelLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (query = '', filters: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (query) params.set('q', query);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`/api/fuel/logs?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs || []);
        setTotalPages(Math.ceil((data.data.total || 0) / 20));
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this fuel log?')) return;
    try {
      const res = await fetch(`/api/fuel/logs/${id}`, { method: 'DELETE' });
      if (res.ok) fetchLogs();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuel Logs</h1>
          <p className="text-gray-600 mt-1">Manage fuel refueling records</p>
        </div>
        <button
          onClick={() => router.push('/fuel/logs/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Fuel Log
        </button>
      </div>

      <FuelSearchFilters onSearch={(q) => fetchLogs(q)} onFilter={(f) => fetchLogs('', f)} />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <FuelLogTable logs={logs} onDelete={handleDelete} />
          <FuelPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
