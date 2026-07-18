'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Truck, User, MapPin, Briefcase, CheckCircle, AlertTriangle, Clock, ArrowRightLeft } from 'lucide-react';

interface VehicleOption {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  status: string;
  availability: string;
}

interface DriverOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  status: string;
}

interface BranchOption {
  id: string;
  name: string;
}

interface DepartmentOption {
  id: string;
  name: string;
}

const typeOptions = [
  { value: 'PRIMARY', label: 'Primary', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: 'TEMPORARY', label: 'Temporary', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: 'SUBSTITUTE', label: 'Substitute', icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-50' },
  { value: 'TRAINING', label: 'Training', icon: AlertTriangle, color: 'text-teal-600', bg: 'bg-teal-50' },
];

export default function NewAssignmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [form, setForm] = useState({
    vehicleId: '',
    driverId: '',
    branchId: '',
    departmentId: '',
    assignmentType: 'PRIMARY',
    notes: '',
    isPrimary: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
    fetchBranches();
    fetchDepartments();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles?page=1&limit=500');
      const data = await res.json();
      if (data.success) setVehicles(data.data.vehicles);
    } catch (e) { console.error(e); }
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/drivers?page=1&limit=500&status=ACTIVE');
      const data = await res.json();
      if (data.success) setDrivers(data.data.drivers);
    } catch (e) { console.error(e); }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      if (data.success) setBranches(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success) setDepartments(data.data || []);
    } catch (e) { console.error(e); }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.vehicleId) errs.vehicleId = 'Vehicle is required';
    if (!form.driverId) errs.driverId = 'Driver is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/dashboard/assignments');
      } else {
        alert(data.error?.message || 'Failed to create assignment');
      }
    } catch (e) {
      alert('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/assignments" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Assignment</h1>
          <p className="text-gray-600 mt-1">Assign a vehicle to a driver</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle *</label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.make} {v.model} ({v.status})</option>)}
              </select>
            </div>
            {errors.vehicleId && <p className="text-sm text-red-600 mt-1">{errors.vehicleId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Driver *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Select driver...</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.firstName} {d.lastName} — {d.employeeId || d.email}</option>)}
              </select>
            </div>
            {errors.driverId && <p className="text-sm text-red-600 mt-1">{errors.driverId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Select branch...</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Select department...</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {typeOptions.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, assignmentType: t.value })}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                    form.assignmentType === t.value
                      ? `${t.bg} border-current ${t.color}`
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional notes about this assignment..."
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isPrimary"
            type="checkbox"
            checked={form.isPrimary}
            onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isPrimary" className="text-sm text-gray-700">Primary assignment (ends any other active assignments for this driver)</label>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Link href="/dashboard/assignments" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </div>
  );
}
