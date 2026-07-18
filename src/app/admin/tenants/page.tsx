'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, PauseCircle, PlayCircle, Trash2, Eye } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import DataTable from '@/components/admin/DataTable';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  status: string;
  createdAt: string;
  _count?: { companyUsers: number; vehicles: number; drivers: number };
  subscriptions?: Array<{ plan: { name: string }; status: string }>;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;
  const router = useRouter();

  const fetchTenants = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('query', search);
    params.set('page', String(page));
    params.set('limit', String(limit));
    fetch(`/api/admin/tenants?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setTenants(res.data.items);
          setTotal(res.data.total);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTenants();
  }, [page, search]);

  const handleSuspend = (id: string) => {
    fetch(`/api/admin/tenants/${id}/suspend`, { method: 'PUT' }).then(() => fetchTenants());
  };

  const handleActivate = (id: string) => {
    fetch(`/api/admin/tenants/${id}/activate`, { method: 'PUT' }).then(() => fetchTenants());
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant?')) return;
    fetch(`/api/admin/tenants/${id}/delete`, { method: 'DELETE' }).then(() => fetchTenants());
  };

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'slug', header: 'Slug', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'status', header: 'Status', render: (t: Tenant) => (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
        t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
        t.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
        t.status === 'TRIAL' ? 'bg-blue-100 text-blue-700' :
        'bg-gray-100 text-gray-700'
      }`}>{t.status}</span>
    )},
    { key: 'users', header: 'Users', render: (t: Tenant) => t._count?.companyUsers ?? 0 },
    { key: 'vehicles', header: 'Vehicles', render: (t: Tenant) => t._count?.vehicles ?? 0 },
    { key: 'actions', header: 'Actions', render: (t: Tenant) => (
      <div className="flex items-center gap-2">
        <button onClick={() => router.push(`/admin/tenants/${t.id}`)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
          <Eye className="h-4 w-4 text-gray-500" />
        </button>
        {t.status !== 'SUSPENDED' ? (
          <button onClick={() => handleSuspend(t.id)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
            <PauseCircle className="h-4 w-4 text-amber-500" />
          </button>
        ) : (
          <button onClick={() => handleActivate(t.id)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
            <PlayCircle className="h-4 w-4 text-emerald-500" />
          </button>
        )}
        <button onClick={() => handleDelete(t.id)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
          <Trash2 className="h-4 w-4 text-red-500" />
        </button>
      </div>
    )},
  ];

  return (
    <div>
      <AdminHeader title="Tenant Management" subtitle="Manage all companies on the platform" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <DataTable
          columns={columns}
          data={tenants}
          keyExtractor={(t) => t.id}
          loading={loading}
        />
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{total} total tenants</p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Page {page}</span>
            <button
              disabled={tenants.length < limit}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
