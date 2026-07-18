'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Map } from 'lucide-react';
import Link from 'next/link';

export default function NewGeofencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'CIRCLE',
    coordinates: [[-1.2921, 36.8219]] as number[][],
    radius: 500,
    isActive: true,
    alertType: 'BOTH',
    speedLimit: '',
    vehicles: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/geofences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          radius: form.type === 'CIRCLE' ? form.radius : undefined,
          speedLimit: form.speedLimit ? Number(form.speedLimit) : undefined,
        }),
      });
      if (res.ok) router.push('/dashboard/geofences');
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard/geofences" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Geofence</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="CIRCLE">Circle</option>
              <option value="POLYGON">Polygon</option>
              <option value="POLYLINE">Polyline</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alert Type</label>
            <select value={form.alertType} onChange={(e) => setForm({ ...form, alertType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="ENTER">Enter</option>
              <option value="EXIT">Exit</option>
              <option value="BOTH">Both</option>
              <option value="DWELL">Dwell</option>
              <option value="SPEED">Speed</option>
            </select>
          </div>
          {form.type === 'CIRCLE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Radius (meters)</label>
              <input type="number" min="10" value={form.radius} onChange={(e) => setForm({ ...form, radius: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Speed Limit (km/h)</label>
            <input type="number" min="0" value={form.speedLimit} onChange={(e) => setForm({ ...form, speedLimit: e.target.value })} placeholder="Optional" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
            <label className="text-sm font-medium text-gray-700">Active</label>
          </div>
        </div>
        <div className="pt-4">
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Save className="w-4 h-4" />{loading ? 'Saving...' : 'Save Geofence'}
          </button>
        </div>
      </form>
    </div>
  );
}
