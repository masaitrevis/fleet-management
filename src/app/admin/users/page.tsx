'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import DataTable from '@/components/admin/DataTable';

interface PlatformUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const limit = 20;

  const fetchUsers = () => {
    setLoading(true);
    fetch(`/api/admin/users?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setUsers(res.data.items);
          setTotal(res.data.total);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleDelete = (id: string) => {
    if (!confirm('Delete this user?')) return;
    fetch(`/api/admin/users/${id}`, { method: 'DELETE' }).then(() => fetchUsers());
  };

  const columns = [
    { key: 'name', header: 'Name', render: (u: PlatformUser) => `${u.firstName} ${u.lastName}` },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (u: PlatformUser) => (
      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{u.role}</span>
    )},
    { key: 'status', header: 'Status', render: (u: PlatformUser) => (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
        u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
      }`}>{u.status}</span>
    )},
    { key: 'actions', header: 'Actions', render: (u: PlatformUser) => (
      <div className="flex items-center gap-2">
        <button className="p-1 rounded hover:bg-gray-100
          <Edit2 className="h-4 w-4 text-gray-500" />
        </button>
        <button onClick={() => handleDelete(u.id)} className="p-1 rounded hover:bg-gray-100
          <Trash2 className="h-4 w-4 text-red-500" />
        </button>
      </div>
    )},
  ];

  return (
    <div>
      <AdminHeader title="Platform Users" subtitle="Manage super admin, support, and engineering team" />
      <div className="p-6 space-y-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Add User
        </button>

        {showForm && (
          <UserForm onCreated={() => { setShowForm(false); fetchUsers(); }} />
        )}

        <DataTable columns={columns} data={users} keyExtractor={(u) => u.id} loading={loading} />

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{total} total users</p>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-700 {page}</span>
            <button disabled={users.length < limit} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'SUPPORT' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(() => onCreated());
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="First Name" className="px-3 py-2 border rounded-md text-sm" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
        <input placeholder="Last Name" className="px-3 py-2 border rounded-md text-sm" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
      </div>
      <input placeholder="Email" type="email" className="w-full px-3 py-2 border rounded-md text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <input placeholder="Password" type="password" className="w-full px-3 py-2 border rounded-md text-sm" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
      <select className="w-full px-3 py-2 border rounded-md text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
        <option value="SUPER_ADMIN">Super Admin</option>
        <option value="SUPPORT">Support</option>
        <option value="SALES">Sales</option>
        <option value="FINANCE">Finance</option>
        <option value="ENGINEER">Engineer</option>
      </select>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">Create User</button>
    </form>
  );
}
