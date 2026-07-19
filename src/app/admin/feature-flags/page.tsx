'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import DataTable from '@/components/admin/DataTable';
import FeatureToggle from '@/components/admin/FeatureToggle';

interface FeatureFlag {
  id: string;
  companyId: string;
  featureKey: string;
  isEnabled: boolean;
  config: Record<string, unknown>;
  company?: { name: string };
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const limit = 20;

  const fetchFlags = () => {
    setLoading(true);
    fetch(`/api/admin/feature-flags?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setFlags(res.data.items);
          setTotal(res.data.total);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFlags();
  }, [page]);

  const handleToggle = (id: string, enabled: boolean) => {
    fetch(`/api/admin/feature-flags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isEnabled: enabled }),
    }).then(() => fetchFlags());
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this feature flag?')) return;
    fetch(`/api/admin/feature-flags/${id}`, { method: 'DELETE' }).then(() => fetchFlags());
  };

  const columns = [
    { key: 'featureKey', header: 'Feature Key', sortable: true },
    { key: 'company', header: 'Company', render: (f: FeatureFlag) => f.company?.name ?? f.companyId },
    { key: 'enabled', header: 'Enabled', render: (f: FeatureFlag) => (
      <FeatureToggle label="" enabled={f.isEnabled} onChange={(v) => handleToggle(f.id, v)} />
    )},
    { key: 'actions', header: 'Actions', render: (f: FeatureFlag) => (
      <button onClick={() => handleDelete(f.id)} className="p-1 rounded hover:bg-gray-100
        <Trash2 className="h-4 w-4 text-red-500" />
      </button>
    )},
  ];

  return (
    <div>
      <AdminHeader title="Feature Flags" subtitle="Toggle features per tenant" />
      <div className="p-6 space-y-4">
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Flag
        </button>

        {showForm && <FlagForm onCreated={() => { setShowForm(false); fetchFlags(); }} />}

        <DataTable columns={columns} data={flags} keyExtractor={(f) => f.id} loading={loading} />

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{total} total flags</p>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-700 {page}</span>
            <button disabled={flags.length < limit} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlagForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ companyId: '', featureKey: '', isEnabled: false });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/admin/feature-flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(() => onCreated());
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
      <input placeholder="Company ID (UUID)" className="w-full px-3 py-2 border rounded-md text-sm" value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })} required />
      <input placeholder="Feature Key" className="w-full px-3 py-2 border rounded-md text-sm" value={form.featureKey} onChange={(e) => setForm({ ...form, featureKey: e.target.value })} required />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isEnabled} onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })} />
        Enabled
      </label>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">Create Flag</button>
    </form>
  );
}
