'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Briefcase, Users, Pencil, Trash2, X } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  color: string | null;
  isActive: boolean;
  manager: { firstName: string; lastName: string } | null;
  _count: { users: number };
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', color: '#3B82F6' });

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success) setDepartments(data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingDept ? `/api/departments/${editingDept.id}` : '/api/departments';
    const method = editingDept ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (data.success) { setShowModal(false); setEditingDept(null); setFormData({ name: '', code: '', description: '', color: '#3B82F6' }); fetchDepartments(); }
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department?')) return;
    try { const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' }); if (res.ok) fetchDepartments(); }
    catch (error) { console.error(error); }
  };

  const filtered = departments.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-gray-900">Departments</h1><p className="text-gray-600 mt-1">Organize your teams by department</p></div>
        <button onClick={() => { setEditingDept(null); setFormData({ name: '', code: '', description: '', color: '#3B82F6' }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" />Add Department</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search departments..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full md:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filtered.map((dept) => (
            <div key={dept.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: dept.color || '#3B82F6' }}>
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{dept.name}</h3>
                    {dept.code && <span className="text-xs text-gray-500">{dept.code}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingDept(dept); setFormData({ name: dept.name, code: dept.code || '', description: dept.description || '', color: dept.color || '#3B82F6' }); setShowModal(true); }} className="p-1.5 rounded hover:bg-gray-100"><Pencil className="w-4 h-4 text-gray-500" /></button>
                  <button onClick={() => handleDelete(dept.id)} className="p-1.5 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
              {dept.description && <p className="text-sm text-gray-600 mt-3">{dept.description}</p>}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{dept._count.users} members</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${dept.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{dept.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editingDept ? 'Edit Department' : 'Add Department'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Code</label><input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Color</label><input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-full h-10 rounded-lg" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingDept ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
