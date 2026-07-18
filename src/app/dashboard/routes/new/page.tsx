'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, MapPin, Route } from 'lucide-react';

export default function NewRoutePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    startLocation: '',
    endLocation: '',
    startLat: '',
    startLng: '',
    endLat: '',
    endLng: '',
    distance: '',
    estimatedDuration: '',
  });

  const [stops, setStops] = useState<any[]>([]);
  const [waypoints, setWaypoints] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        ...form,
        startLat: form.startLat ? Number(form.startLat) : undefined,
        startLng: form.startLng ? Number(form.startLng) : undefined,
        endLat: form.endLat ? Number(form.endLat) : undefined,
        endLng: form.endLng ? Number(form.endLng) : undefined,
        distance: form.distance ? Number(form.distance) : undefined,
        estimatedDuration: form.estimatedDuration ? Number(form.estimatedDuration) : undefined,
        routeStops: stops.length > 0 ? stops : undefined,
        waypoints: waypoints.length > 0 ? waypoints : undefined,
      };
      const res = await fetch('/api/routes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { router.push('/dashboard/routes'); }
      else { alert(data.error?.message || 'Failed to create route'); }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const addStop = () => setStops([...stops, { name: '', address: '', latitude: 0, longitude: 0, stopOrder: stops.length, stopType: 'WAYPOINT', estimatedWaitTime: '' }]);
  const updateStop = (i: number, field: string, value: any) => { const u = [...stops]; u[i] = { ...u[i], [field]: value }; setStops(u); };
  const removeStop = (i: number) => setStops(stops.filter((_, idx) => idx !== i));

  const addWaypoint = () => setWaypoints([...waypoints, { latitude: 0, longitude: 0, order: waypoints.length }]);
  const updateWaypoint = (i: number, field: string, value: any) => { const u = [...waypoints]; u[i] = { ...u[i], [field]: value }; setWaypoints(u); };
  const removeWaypoint = (i: number) => setWaypoints(waypoints.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/routes" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Route</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Nairobi - Mombasa Highway" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Location *</label>
              <input required value={form.startLocation} onChange={(e) => setForm({ ...form, startLocation: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Nairobi CBD" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Location *</label>
              <input required value={form.endLocation} onChange={(e) => setForm({ ...form, endLocation: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Mombasa Port" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Latitude</label>
              <input type="number" step="0.000001" value={form.startLat} onChange={(e) => setForm({ ...form, startLat: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Longitude</label>
              <input type="number" step="0.000001" value={form.startLng} onChange={(e) => setForm({ ...form, startLng: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Latitude</label>
              <input type="number" step="0.000001" value={form.endLat} onChange={(e) => setForm({ ...form, endLat: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Longitude</label>
              <input type="number" step="0.000001" value={form.endLng} onChange={(e) => setForm({ ...form, endLng: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
              <input type="number" step="0.1" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration (min)</label>
              <input type="number" value={form.estimatedDuration} onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5" />Route Stops
            </h2>
            <button type="button" onClick={addStop} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
              <Plus className="w-4 h-4" />Add Stop
            </button>
          </div>
          <div className="space-y-3">
            {stops.map((stop, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Stop Name</label>
                  <input value={stop.name} onChange={(e) => updateStop(i, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Rest Stop" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Address</label>
                  <input value={stop.address} onChange={(e) => updateStop(i, 'address', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Full address" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Latitude</label>
                  <input type="number" step="0.000001" value={stop.latitude} onChange={(e) => updateStop(i, 'latitude', Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Longitude</label>
                  <input type="number" step="0.000001" value={stop.longitude} onChange={(e) => updateStop(i, 'longitude', Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Wait Time (min)</label>
                  <input type="number" value={stop.estimatedWaitTime} onChange={(e) => updateStop(i, 'estimatedWaitTime', e.target.value ? Number(e.target.value) : undefined)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Stop Type</label>
                  <select value={stop.stopType} onChange={(e) => updateStop(i, 'stopType', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="WAYPOINT">Waypoint</option>
                    <option value="PICKUP">Pickup</option>
                    <option value="DELIVERY">Delivery</option>
                    <option value="REST_STOP">Rest Stop</option>
                    <option value="FUEL_STOP">Fuel Stop</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={() => removeStop(i)} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Route className="w-5 h-5" />Waypoints
            </h2>
            <button type="button" onClick={addWaypoint} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
              <Plus className="w-4 h-4" />Add Waypoint
            </button>
          </div>
          <div className="space-y-2">
            {waypoints.map((wp, i) => (
              <div key={i} className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
                <span className="text-sm font-medium text-gray-500 w-8">{wp.order + 1}</span>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Latitude</label>
                  <input type="number" step="0.000001" value={wp.latitude} onChange={(e) => updateWaypoint(i, 'latitude', Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Longitude</label>
                  <input type="number" step="0.000001" value={wp.longitude} onChange={(e) => updateWaypoint(i, 'longitude', Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <button type="button" onClick={() => removeWaypoint(i)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Route'}
          </button>
          <Link href="/dashboard/routes" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
