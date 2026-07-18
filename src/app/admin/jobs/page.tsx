'use client';

import { useEffect, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import QueueMonitor from '@/components/admin/QueueMonitor';

interface Job {
  id: string;
  type: string;
  status: string;
  queue: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  error: string | null;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchJobs = () => {
    setLoading(true);
    fetch(`/api/admin/jobs?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setJobs(res.data.items);
          setTotal(res.data.total);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, [page]);

  const handleRetry = (id: string) => {
    fetch(`/api/admin/jobs/${id}`, { method: 'POST' }).then(() => fetchJobs());
  };

  const handleCancel = (id: string) => {
    fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' }).then(() => fetchJobs());
  };

  return (
    <div>
      <AdminHeader title="Queue Manager" subtitle="Monitor and manage background jobs" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{total} total jobs</p>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Page {page}</span>
            <button disabled={jobs.length < limit} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50">Next</button>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded" />)}
          </div>
        ) : (
          <QueueMonitor jobs={jobs as any} onRetry={handleRetry} onCancel={handleCancel} />
        )}
      </div>
    </div>
  );
}
