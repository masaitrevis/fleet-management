'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Truck, Fuel, Settings, FileText, Palette, DollarSign, Gauge } from 'lucide-react';

const tabs = [
  { id: 'basic', label: 'Basic Info', icon: Truck },
  { id: 'specs', label: 'Specifications', icon: Settings },
  { id: 'ownership', label: 'Ownership', icon: FileText },
  { id: 'purchase', label: 'Purchase', icon: DollarSign },
];

const FUEL_TYPES = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG', 'LPG'];
const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC', 'CVT', 'SEMI_AUTOMATIC'];
const STATUSES = ['ACTIVE', 'IN_MAINTENANCE', 'RESERVED', 'OUT_OF_SERVICE', 'SOLD', 'SCRAPPED', 'STOLEN'];
const AVAILABILITIES = ['AVAILABLE', 'ASSIGNED', 'RESERVED', 'MAINTENANCE', 'OFFLINE'];
const CATEGORIES = ['TRUCK', 'BUS', 'VAN', 'PICKUP', 'SUV', 'SEDAN', 'MOTORCYCLE', 'TRAILER', 'HEAVY_EQUIPMENT'];

export default function VehicleFormPage() {
  const router = useRouter();
  const params = useParams();
  const isEdit = Boolean(params?.id && params?.id !== 'new');
  const vehicleId = isEdit ? (params?.id as string) : null;

  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [formData, setFormData] = useState<Record<string, any>>({
    status: 'ACTIVE',
    availability: 'AVAILABLE',
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    if (isEdit && vehicleId) fetchVehicle();
  }, [vehicleId]);

  const fetchVehicle = async () => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`);
      const data = await res.json();
      if (data.success) setFormData(data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isEdit ? `/api/vehicles/${vehicleId}` : '/api/vehicles';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (data.success) router.push(`/dashboard/vehicles/${data.data.id || vehicleId}`);
      else alert(data.error?.message || 'Failed to save');
    } catch (error) { console.error(error); alert('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  const field = (label: string, name: string, type = 'text', options?: string[], required = false) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {options ? (
        <select
          value={formData[name] || ''}
          onChange={(e) => handleChange(name, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select {label}</option>
          {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
        </select>
      ) : type === 'number' ? (
        <input
          type="number"
          value={formData[name] || ''}
          onChange={(e) => handleChange(name, e.target.value === '' ? undefined : Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      ) : type === 'date' ? (
        <input
          type="date"
          value={formData[name] ? new Date(formData[name]).toISOString().split('T')[0] : ''}
          onChange={(e) => handleChange(name, e.target.value ? new Date(e.target.value).toISOString() : undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <input
          type={type}
          value={formData[name] || ''}
          onChange={(e) => handleChange(name, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  );

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/vehicles${vehicleId ? `/${vehicleId}` : ''}`} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              {field('Registration Number', 'registrationNumber', 'text', undefined, true)}
              {field('Plate Number', 'plateNumber')}
              {field('VIN', 'vin')}
              {field('Chassis Number', 'chassisNumber')}
              {field('Engine Number', 'engineNumber')}
              {field('Make', 'make', 'text', undefined, true)}
              {field('Model', 'model', 'text', undefined, true)}
              {field('Trim', 'trim')}
              {field('Year', 'year', 'number')}
              {field('Color', 'color')}
              {field('Category', 'category', 'select', CATEGORIES)}
              {field('Status', 'status', 'select', STATUSES)}
              {field('Availability', 'availability', 'select', AVAILABILITIES)}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              {field('Fuel Type', 'fuelType', 'select', FUEL_TYPES)}
              {field('Transmission', 'transmission', 'select', TRANSMISSIONS)}
              {field('Engine Capacity (cc)', 'engineCapacity', 'number')}
              {field('Horsepower', 'horsepower', 'number')}
              {field('Torque (Nm)', 'torque', 'number')}
              {field('Seating Capacity', 'seatingCapacity', 'number')}
              {field('Payload Capacity (kg)', 'payloadCapacity', 'number')}
              {field('Gross Weight (kg)', 'grossWeight', 'number')}
              {field('Axles', 'axles', 'number')}
              {field('Tyre Size', 'tyreSize')}
              {field('Fuel Tank Capacity (L)', 'fuelTankCapacity', 'number')}
              {field('Current Odometer (km)', 'odometer', 'number')}
              {field('Engine Hours', 'engineHours', 'number')}
            </div>
          )}

          {activeTab === 'ownership' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              {field('Branch ID', 'branchId')}
              {field('Department ID', 'departmentId')}
              {field('Fleet Manager ID', 'fleetManagerId')}
              {field('Current Driver ID', 'currentDriverId')}
            </div>
          )}

          {activeTab === 'purchase' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              {field('Purchase Date', 'purchaseDate', 'date')}
              {field('Purchase Price', 'purchasePrice', 'number')}
              {field('Current Value', 'currentValue', 'number')}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Link href={`/dashboard/vehicles${vehicleId ? `/${vehicleId}` : ''}`} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
}
