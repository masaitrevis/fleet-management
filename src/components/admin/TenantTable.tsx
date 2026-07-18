'use client';

import { useState } from 'react';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import { Eye, Ban, Trash2, UserCog } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'pending' | 'trial';
  userCount: number;
  vehicleCount: number;
  plan: string;
  createdAt: string;
}

interface TenantTableProps {
  tenants: Tenant[];
  loading?: boolean;
  onView?: (id: string) => void;
  onSuspend?: (id: string) => void;
  onDelete?: (id: string) => void;
  onImpersonate?: (id: string) => void;
}

export default function TenantTable({ tenants, loading, onView, onSuspend, onDelete, onImpersonate }: TenantTableProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'slug', header: 'Slug', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (t: Tenant) => <StatusBadge status={t.status} />,
    },
    { key: 'userCount', header: 'Users', sortable: true },
    { key: 'vehicleCount', header: 'Vehicles', sortable: true },
    { key: 'plan', header: 'Plan', sortable: true },
    {
      key: 'createdAt',
      header: 'Created',
      render: (t: Tenant) => new Date(t.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t: Tenant) => (
        <div className="flex items-center gap-1">
          {onView && (
            <button onClick={() => onView(t.id)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors" title="View">
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onImpersonate && (
            <button onClick={() => onImpersonate(t.id)} className="p-1.5 text-gray-400 hover:text-purple-600 rounded-md hover:bg-purple-50 transition-colors" title="Impersonate">
              <UserCog className="w-4 h-4" />
            </button>
          )}
          {onSuspend && (
            <button onClick={() => onSuspend(t.id)} className="p-1.5 text-gray-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition-colors" title="Suspend/Activate">
              <Ban className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => setConfirmDelete(confirmDelete === t.id ? null : t.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {confirmDelete === t.id && (
            <div className="absolute right-0 mt-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-3 z-10">
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Confirm delete?</p>
              <div className="flex gap-2">
                <button onClick={() => { onDelete?.(t.id); setConfirmDelete(null); }} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Delete</button>
                <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">Cancel</button>
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={tenants}
      keyExtractor={(t) => t.id}
      searchable
      searchKeys={['name', 'slug', 'plan']}
      loading={loading}
    />
  );
}
