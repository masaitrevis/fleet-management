'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, MapPin, Package, ClipboardCheck
} from 'lucide-react';

interface Vehicle { id: string; registrationNumber: string; make: string; model: string; }
interface Driver { id: string; firstName: string; lastName: string; }
interface RouteItem { id: string; name: string; }
interface Customer { id: string; name: string; }

export default function NewTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    vehicleId: '',
    driverId: '',
    routeId: '',
    customerId: '',
    startTime: '',
    estimatedEndTime: '',
    estimatedDistance: '',
    notes: '',
    priority: 'NORMAL',
  });

  const [stops, setStops] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/vehicles').then(r => r.json()).then(d => { if (d.success) setVehicles(d.data.vehicles); });
    fetch('/api/drivers').then(r => r.json()).then(d => { if (d.success) setDrivers(d.data.drivers); });
    fetch('/api/routes').then(r => r.json()).then(d => { if (d.success) setRoutes(d.data.routes); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        ...form,
        estimatedDistance: form.estimatedDistance ? Number(form.estimatedDistance) : undefined,
        startTime: form.startTime || undefined,
        estimatedEndTime: form.estimatedEndTime || undefined,
        routeId: form.routeId || undefined,
        customerId: form.customerId || undefined,
        tripStops: stops.length > 0 ? stops : undefined,
        tripCargos: cargos.length > 0 ? cargos : undefined,
        tripChecklists: checklist.length > 0 ? checklist : undefined,
      };
      const res = await fetch('/api/trips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { router.push('/dashboard/trips'); }
      else { alert(data.error?.message || 'Failed to create trip'); }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const addStop = () => setStops([...stops, { name: '', address: '', latitude: 0, longitude: 0, scheduledArrival: '', notes: '' }]);
  const updateStop = (i: number, field: string, value: any) => {
    const updated = [...stops];
    updated[i] = { ...updated[i], [field]: value };
    setStops(updated);
  };
  const removeStop = (i: number) => setStops(stops.filter((_, idx) => idx !== i));

  const addCargo = () => setCargos([...cargos, { cargoType: '', weight: '', volume: '', quantity: '', isDangerousGoods: false, notes: '' }]);
  const updateCargo = (i: number, field: string, value: any) => {
    const updated = [...cargos];
    updated[i] = { ...updated[i], [field]: value };
    setCargos(updated);
  };
  const removeCargo = (i: number) => setCargos(cargos.filter((_, idx) => idx !== i));

  const addChecklistItem = () => setChecklist([...checklist, { item: '', isRequired: true }]);
  const updateChecklistItem = (i: number, field: string, value: any) => {
    const updated = [...checklist];
    updated[i] = { ...updated[i], [field]: value };
    setChecklist(updated);
  };
  const removeChecklistItem = (i: number) => setChecklist(checklist.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/trips" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Trip</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Nairobi to Mombasa Delivery" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
              <select required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNumber} - {v.make} {v.model}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver *</label>
              <select required value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select driver...</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
              <select value={form.routeId} onChange={(e) => setForm({ ...form, routeId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select route...</option>
                {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated End Time</label>
              <input type="datetime-local" value={form.estimatedEndTime} onChange={(e) => setForm({ ...form, estimatedEndTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Distance (km)</label>
              <input type="number" step="0.1" value={form.estimatedDistance} onChange={(e) => setForm({ ...form, estimatedDistance: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5" />Trip Stops
            </h2>
            <button type="button" onClick={addStop} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
              <Plus className="w-4 h-4" />Add Stop
            </button>
          </div>
          {stops.length === 0 && <p className="text-gray-500 text-sm">No stops added</p>}
          <div className="space-y-3">
            {stops.map((stop, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Stop Name</label>
                  <input value={stop.name} onChange={(e) => updateStop(i, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Pickup Point A" />
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
                  <label className="block text-sm text-gray-600 mb-1">Scheduled Arrival</label>
                  <input type="datetime-local" value={stop.scheduledArrival} onChange={(e) => updateStop(i, 'scheduledArrival', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="md:col-span-3 flex justify-end">
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
              <Package className="w-5 h-5" />Cargo
            </h2>
            <button type="button" onClick={addCargo} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
              <Plus className="w-4 h-4" />Add Cargo
            </button>
          </div>
          {cargos.length === 0 && <p className="text-gray-500 text-sm">No cargo items</p>}
          <div className="space-y-3">
            {cargos.map((cargo, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Cargo Type</label>
                  <input value={cargo.cargoType} onChange={(e) => updateCargo(i, 'cargoType', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Electronics" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Weight (kg)</label>
                  <input type="number" step="0.1" value={cargo.weight} onChange={(e) => updateCargo(i, 'weight', e.target.value ? Number(e.target.value) : undefined)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Volume (m³)</label>
                  <input type="number" step="0.01" value={cargo.volume} onChange={(e) => updateCargo(i, 'volume', e.target.value ? Number(e.target.value) : undefined)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Notes</label>
                  <input value={cargo.notes} onChange={(e) => updateCargo(i, 'notes', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={() => removeCargo(i)} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
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
              <ClipboardCheck className="w-5 h-5" />Checklist
            </h2>
            <button type="button" onClick={addChecklistItem} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
              <Plus className="w-4 h-4" />Add Item
            </button>
          </div>
          {checklist.length === 0 && <p className="text-gray-500 text-sm">No checklist items</p>}
          <div className="space-y-2">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
                <input value={item.item} onChange={(e) => updateChecklistItem(i, 'item', e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Checklist item" />
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={item.isRequired} onChange={(e) => updateChecklistItem(i, 'isRequired', e.target.checked)} /> Required
                </label>
                <button type="button" onClick={() => removeChecklistItem(i)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Trip'}
          </button>
          <Link href="/dashboard/trips" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
