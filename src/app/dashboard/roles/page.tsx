'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Shield, Copy, Pencil, Trash2, X, Check } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  _count: { userRoles: number };
}

const ALL_PERMISSIONS = [
  'users:create', 'users:read', 'users:update', 'users:delete',
  'company:manage', 'company:read', 'company:update',
  'vehicles:manage', 'vehicles:create', 'vehicles:read', 'vehicles:update', 'vehicles:delete',
  'drivers:manage', 'trips:manage', 'maintenance:manage',
  'fuel:manage', 'expenses:manage', 'invoices:manage',
  'reports:view', 'settings:manage', 'branches:manage', 'departments:manage', 'roles:manage',
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] as string[] });

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (data.success) setRoles(data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
    const method = editingRole ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (data.success) { setShowModal(false); setEditingRole(null); setFormData({ name: '', description: '', permissions: [] }); fetchRoles(); }
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this role?')) return;
    try { const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' }); if (res.ok) fetchRoles(); }
    catch (error) { console.error(error); }
  };

  const handleClone = async (role: Role) => {
    try {
      const res = await fetch(`/api/roles/${role.id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${role.name} (Copy)`, description: role.description }),
      });
      if (res.ok) fetchRoles();
    } catch (error) { console.error(error); }
  };

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const filtered = roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1><p className="text-gray-600 mt-1">Manage user roles and access permissions</p></div>
        <button onClick={() => { setEditingRole(null); setFormData({ name: '', description: '', permissions: [] }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" />Create Role</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search roles..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full md:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filtered.map((role) => (
            <div key={role.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{role.name}</h3>
                      {role.isSystem && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">System</span>}
                    </div>
                    {role.description && <p className="text-sm text-gray-600 mt-0.5">{role.description}</p>}
                    <p className="text-sm text-gray-500 mt-1">{role._count.userRoles} users assigned</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {role.permissions.slice(0, 5).map((perm, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{perm}</span>
                      ))}
                      {role.permissions.length > 5 && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">+{role.permissions.length - 5} more</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!role.isSystem && (
                    <>
                      <button onClick={() => { setEditingRole(role); setFormData({ name: role.name, description: role.description || '', permissions: role.permissions }); setShowModal(true); }} className="p-1.5 rounded hover:bg-gray-100"><Pencil className="w-4 h-4 text-gray-500" /></button>
                      <button onClick={() => handleClone(role)} className="p-1.5 rounded hover:bg-gray-100" title="Clone"><Copy className="w-4 h-4 text-gray-500" /></button>
                      <button onClick={() => handleDelete(role.id)} className="p-1.5 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editingRole ? 'Edit Role' : 'Create Role'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows={2} /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ALL_PERMISSIONS.map((perm) => (
                    <button key={perm} type="button" onClick={() => togglePermission(perm)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${formData.permissions.includes(perm) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                      {formData.permissions.includes(perm) ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded border border-gray-300" />}
                      {perm}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingRole ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
