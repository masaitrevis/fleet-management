'use client';

import { useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { Database, Play, RotateCcw, CheckCircle } from 'lucide-react';

interface Backup {
  id: string;
  name: string;
  type: 'full' | 'incremental';
  status: 'completed' | 'running' | 'failed';
  size: string;
  startedAt: string;
  completedAt?: string;
  duration?: string;
}

const demoBackups: Backup[] = [
  { id: '1', name: 'Daily Full Backup', type: 'full', status: 'completed', size: '4.2 GB', startedAt: '2026-07-19T02:00:00Z', completedAt: '2026-07-19T02:15:00Z', duration: '15m' },
  { id: '2', name: 'Daily Full Backup', type: 'full', status: 'completed', size: '4.1 GB', startedAt: '2026-07-18T02:00:00Z', completedAt: '2026-07-18T02:14:00Z', duration: '14m' },
  { id: '3', name: 'Weekly Full Backup', type: 'full', status: 'completed', size: '4.0 GB', startedAt: '2026-07-17T02:00:00Z', completedAt: '2026-07-17T02:18:00Z', duration: '18m' },
  { id: '4', name: 'Pre-Migration Backup', type: 'full', status: 'completed', size: '3.9 GB', startedAt: '2026-07-15T10:00:00Z', completedAt: '2026-07-15T10:20:00Z', duration: '20m' },
  { id: '5', name: 'Incremental Backup', type: 'incremental', status: 'failed', size: '-', startedAt: '2026-07-14T14:00:00Z', duration: '2m' },
];

export default function BackupsPage() {
  const [backups, setBackups] = useState(demoBackups);
  const [restoring, setRestoring] = useState<string | null>(null);

  const triggerBackup = () => {
    const newBackup: Backup = {
      id: Date.now().toString(),
      name: 'Manual Full Backup',
      type: 'full',
      status: 'running',
      size: '-',
      startedAt: new Date().toISOString(),
    };
    setBackups([newBackup, ...backups]);
    setTimeout(() => {
      setBackups((prev) => prev.map((b) => b.id === newBackup.id ? { ...b, status: 'completed', size: '4.2 GB', completedAt: new Date().toISOString(), duration: '12m' } : b));
    }, 3000);
  };

  const handleRestore = (id: string) => {
    setRestoring(id);
    setTimeout(() => setRestoring(null), 2000);
  };

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    {
      key: 'type',
      header: 'Type',
      render: (b: Backup) => <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">{b.type}</span>,
    },
    { key: 'status', header: 'Status', render: (b: Backup) => <StatusBadge status={b.status} /> },
    { key: 'size', header: 'Size', sortable: true },
    { key: 'startedAt', header: 'Started', render: (b: Backup) => new Date(b.startedAt).toLocaleString(), sortable: true },
    { key: 'duration', header: 'Duration', render: (b: Backup) => b.duration || '-' },
    {
      key: 'actions',
      header: 'Actions',
      render: (b: Backup) => (
        <div className="flex items-center gap-1">
          {b.status === 'completed' && (
            <button
              onClick={() => handleRestore(b.id)}
              disabled={restoring === b.id}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {restoring === b.id ? 'Restoring...' : 'Restore'}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Backup Center</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage database backups and restores</p>
        </div>
        <button onClick={triggerBackup} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          <Database className="w-4 h-4" />
          Trigger Backup
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Backups</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{backups.length}</p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Database className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Successful</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{backups.filter((b) => b.status === 'completed').length}</p>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last Backup</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{backups[0]?.completedAt ? new Date(backups[0].completedAt).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Play className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Backup History</h3>
        <DataTable columns={columns} data={backups} keyExtractor={(b) => b.id} searchable searchKeys={['name', 'type']} />
      </div>
    </div>
  );
}
