'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import AuditTimeline from '@/components/admin/AuditTimeline';

interface AuditEvent {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  userId: string | null;
}

export default function AuditLogsPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 50;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/audit-logs?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setEvents(res.data.items);
          setTotal(res.data.total);
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  const handleExport = () => {
    const csv = [
      'ID,Action,Entity Type,Entity ID,Details,Created At,User ID',
      ...events.map((e) => `${e.id},${e.action},${e.entityType},${e.entityId ?? ''},"${e.details ?? ''}",${e.createdAt},${e.userId ?? ''}`),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div>
      <AdminHeader title="Audit Logs" subtitle="Track all platform admin actions" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{total} total events</p>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded" />)}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <AuditTimeline events={events} />
          </div>
        )}

        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50">Previous</button>
          <span className="text-sm text-gray-700 {page}</span>
          <button disabled={events.length < limit} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}
