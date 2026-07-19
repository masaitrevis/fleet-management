'use client';

import { RefreshCw, Pause, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { JobStatus } from '@/modules/platform-admin/types';

interface JobItem {
  id: string;
  type: string;
  status: JobStatus;
  queue: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  error?: string;
}

interface QueueMonitorProps {
  jobs: JobItem[];
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Pause className="h-4 w-4 text-amber-500" />,
  PROCESSING: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  COMPLETED: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  FAILED: <XCircle className="h-4 w-4 text-red-500" />,
  RETRYING: <RefreshCw className="h-4 w-4 text-orange-500 animate-spin" />,
  CANCELLED: <XCircle className="h-4 w-4 text-gray-400" />,
};

export default function QueueMonitor({ jobs, onRetry, onCancel }: QueueMonitorProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700
              <th className="px-4 py-3 text-left font-medium text-gray-700
              <th className="px-4 py-3 text-left font-medium text-gray-700
              <th className="px-4 py-3 text-left font-medium text-gray-700
              <th className="px-4 py-3 text-left font-medium text-gray-700
              <th className="px-4 py-3 text-left font-medium text-gray-700
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 jobs found</td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {statusIcons[job.status] || <Pause className="h-4 w-4" />}
                      <span className="text-xs font-medium text-gray-700
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900
                  <td className="px-4 py-3 text-gray-500
                  <td className="px-4 py-3 text-gray-500
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(job.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {job.status === 'FAILED' && onRetry && (
                        <button onClick={() => onRetry(job.id)} className="text-xs text-blue-600 hover:text-blue-800
                      )}
                      {(job.status === 'PENDING' || job.status === 'PROCESSING' || job.status === 'RETRYING') && onCancel && (
                        <button onClick={() => onCancel(job.id)} className="text-xs text-red-600 hover:text-red-800
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
