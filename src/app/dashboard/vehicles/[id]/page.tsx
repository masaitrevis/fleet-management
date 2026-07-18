'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Pencil, Trash2, MapPin, User, Fuel, Settings, Calendar, Gauge, Palette,
  FileText, History, Image, Upload, X, CheckCircle, Wrench, Ban, AlertTriangle, XCircle, ChevronRight
} from 'lucide-react';

interface VehicleDetail {
  id: string;
  registrationNumber: string;
  plateNumber?: string;
  vin?: string;
  chassisNumber?: string;
  engineNumber?: string;
  make: string;
  model: string;
  trim?: string;
  year?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  status: string;
  availability: string;
  category?: string;
  color?: string;
  fuelType?: string;
  transmission?: string;
  engineCapacity?: number;
  horsepower?: number;
  torque?: number;
  seatingCapacity?: number;
  payloadCapacity?: number;
  grossWeight?: number;
  axles?: number;
  tyreSize?: string;
  fuelTankCapacity?: number;
  odometer?: number;
  engineHours?: number;
  branch?: { name: string };
  department?: { name: string };
  currentDriver?: { firstName: string; lastName: string; email: string; phone?: string };
  fleetManager?: { firstName: string; lastName: string; email: string };
  images?: { id: string; url: string; thumbnail: string; isPrimary: boolean }[];
  documents?: { id: string; documentType: string; title: string; expiryDate?: string }[];
  assignments?: { id: string; driver: { firstName: string; lastName: string }; assignedAt: string; endedAt?: string; notes?: string }[];
  odometerReadings?: { reading: number; source: string; createdAt: string }[];
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  ACTIVE: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Active' },
  IN_MAINTENANCE: { icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50', label: 'In Maintenance' },
  RESERVED: { icon: AlertTriangle, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Reserved' },
  OUT_OF_SERVICE: { icon: Ban, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Out of Service' },
  SOLD: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Sold' },
  SCRAPPED: { icon: Ban, color: 'text-red-700', bg: 'bg-red-100', label: 'Scrapped' },
  STOLEN: { icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-100', label: 'Stolen' },
};

export default function VehicleDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => { fetchVehicle(); }, [id]);

  const fetchVehicle = async () => {
    try {
      const res = await fetch(`/api/vehicles/${id}`);
      const data = await res.json();
      if (data.success) setVehicle(data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleUploadImage = async () => {
    if (!imageFile) return;
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('isPrimary', 'false');
    try {
      const res = await fetch(`/api/vehicles/${id}/upload-image`, { method: 'POST', body: formData });
      if (res.ok) { setImageFile(null); fetchVehicle(); }
    } catch (error) { console.error(error); }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Delete this image?')) return;
    try { const res = await fetch(`/api/vehicles/${id}/images/${imageId}`, { method: 'DELETE' }); if (res.ok) fetchVehicle(); }
    catch (error) { console.error(error); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this vehicle?')) return;
    try { const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' }); if (res.ok) window.location.href = '/dashboard/vehicles'; }
    catch (error) { console.error(error); }
  };

  if (loading || !vehicle) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  const cfg = statusConfig[vehicle.status] || statusConfig.OUT_OF_SERVICE;
  const StatusIcon = cfg.icon;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Settings },
    { id: 'specs', label: 'Specifications', icon: Gauge },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'history', label: 'History', icon: History },
    { id: 'images', label: 'Images', icon: Image },
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/vehicles" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{vehicle.registrationNumber}</h1>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
              <StatusIcon className="w-3 h-3" />{cfg.label}
            </span>
          </div>
          <p className="text-gray-600">{vehicle.make} {vehicle.model} {vehicle.year ? `· ${vehicle.year}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/vehicles/${id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Pencil className="w-4 h-4" />Edit
          </Link>
          <button onClick={handleDelete} className="p-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><p className="text-sm text-gray-500">Registration</p><p className="font-medium">{vehicle.registrationNumber}</p></div>
                <div><p className="text-sm text-gray-500">Plate Number</p><p className="font-medium">{vehicle.plateNumber || '—'}</p></div>
                <div><p className="text-sm text-gray-500">VIN</p><p className="font-medium">{vehicle.vin || '—'}</p></div>
                <div><p className="text-sm text-gray-500">Make</p><p className="font-medium">{vehicle.make}</p></div>
                <div><p className="text-sm text-gray-500">Model</p><p className="font-medium">{vehicle.model}</p></div>
                <div><p className="text-sm text-gray-500">Year</p><p className="font-medium">{vehicle.year || '—'}</p></div>
                <div><p className="text-sm text-gray-500">Color</p><div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border" style={{ backgroundColor: vehicle.color || '#ccc' }} /><p className="font-medium">{vehicle.color || '—'}</p></div></div>
                <div><p className="text-sm text-gray-500">Category</p><p className="font-medium">{vehicle.category || '—'}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Ownership & Assignment</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><p className="text-sm text-gray-500">Branch</p><p className="font-medium flex items-center gap-1"><MapPin className="w-3 h-3" />{vehicle.branch?.name || '—'}</p></div>
                <div><p className="text-sm text-gray-500">Department</p><p className="font-medium">{vehicle.department?.name || '—'}</p></div>
                <div><p className="text-sm text-gray-500">Fleet Manager</p><p className="font-medium">{vehicle.fleetManager ? `${vehicle.fleetManager.firstName} ${vehicle.fleetManager.lastName}` : '—'}</p></div>
                <div><p className="text-sm text-gray-500">Current Driver</p><p className="font-medium flex items-center gap-1"><User className="w-3 h-3" />{vehicle.currentDriver ? `${vehicle.currentDriver.firstName} ${vehicle.currentDriver.lastName}` : '—'}</p></div>
                <div><p className="text-sm text-gray-500">Availability</p><p className="font-medium">{vehicle.availability}</p></div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Odometer</span>
                  <span className="font-semibold">{(vehicle.odometer || 0).toLocaleString()} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Engine Hours</span>
                  <span className="font-semibold">{vehicle.engineHours || 0} h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Purchase Price</span>
                  <span className="font-semibold">{vehicle.purchasePrice ? `$${vehicle.purchasePrice.toLocaleString()}` : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Current Value</span>
                  <span className="font-semibold">{vehicle.currentValue ? `$${vehicle.currentValue.toLocaleString()}` : '—'}</span>
                </div>
              </div>
            </div>

            {vehicle.documents && vehicle.documents.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Documents ({vehicle.documents.length})</h2>
                <div className="space-y-2">
                  {vehicle.documents.slice(0, 5).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">{doc.title}</span>
                      </div>
                      {doc.expiryDate && <span className="text-xs text-gray-500">Exp: {new Date(doc.expiryDate).toLocaleDateString()}</span>}
                    </div>
                  ))}
                </div>
                <Link href={`/dashboard/vehicles/${id}/documents`} className="flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700">
                  View all documents <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'specs' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Technical Specifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-sm text-gray-500">Fuel Type</p><p className="font-medium">{vehicle.fuelType || '—'}</p></div>
            <div><p className="text-sm text-gray-500">Transmission</p><p className="font-medium">{vehicle.transmission || '—'}</p></div>
            <div><p className="text-sm text-gray-500">Engine Capacity</p><p className="font-medium">{vehicle.engineCapacity ? `${vehicle.engineCapacity} cc` : '—'}</p></div>
            <div><p className="text-sm text-gray-500">Horsepower</p><p className="font-medium">{vehicle.horsepower ? `${vehicle.horsepower} hp` : '—'}</p></div>
            <div><p className="text-sm text-gray-500">Torque</p><p className="font-medium">{vehicle.torque ? `${vehicle.torque} Nm` : '—'}</p></div>
            <div><p className="text-sm text-gray-500">Seating Capacity</p><p className="font-medium">{vehicle.seatingCapacity || '—'}</p></div>
            <div><p className="text-sm text-gray-500">Payload Capacity</p><p className="font-medium">{vehicle.payloadCapacity ? `${vehicle.payloadCapacity} kg` : '—'}</p></div>
            <div><p className="text-sm text-gray-500">Gross Weight</p><p className="font-medium">{vehicle.grossWeight ? `${vehicle.grossWeight} kg` : '—'}</p></div>
            <div><p className="text-sm text-gray-500">Axles</p><p className="font-medium">{vehicle.axles || '—'}</p></div>
            <div><p className="text-sm text-gray-500">Tyre Size</p><p className="font-medium">{vehicle.tyreSize || '—'}</p></div>
            <div><p className="text-sm text-gray-500">Fuel Tank Capacity</p><p className="font-medium">{vehicle.fuelTankCapacity ? `${vehicle.fuelTankCapacity} L` : '—'}</p></div>
            <div><p className="text-sm text-gray-500">Chassis Number</p><p className="font-medium">{vehicle.chassisNumber || '—'}</p></div>
            <div><p className="text-sm text-gray-500">Engine Number</p><p className="font-medium">{vehicle.engineNumber || '—'}</p></div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Documents</h2>
          {vehicle.documents && vehicle.documents.length > 0 ? (
            <div className="space-y-2">
              {vehicle.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-gray-500">{doc.documentType}</p>
                    </div>
                  </div>
                  {doc.expiryDate && <span className="text-sm text-gray-500">Exp: {new Date(doc.expiryDate).toLocaleDateString()}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No documents uploaded</p>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Assignment History</h2>
          {vehicle.assignments && vehicle.assignments.length > 0 ? (
            <div className="space-y-3">
              {vehicle.assignments.map((a, i) => (
                <div key={a.id} className="flex items-start gap-4 p-3 border border-gray-100 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Assigned to {a.driver.firstName} {a.driver.lastName}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Started: {new Date(a.assignedAt).toLocaleDateString()}</span>
                      {a.endedAt && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Ended: {new Date(a.endedAt).toLocaleDateString()}</span>}
                    </div>
                    {a.notes && <p className="text-sm text-gray-600 mt-1">{a.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No assignment history</p>
          )}
        </div>
      )}

      {activeTab === 'images' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Images</h2>
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="hidden" id="vehicle-image-upload" />
              <label htmlFor="vehicle-image-upload" className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm">
                <Upload className="w-4 h-4" />Upload
              </label>
              {imageFile && <button onClick={handleUploadImage} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm">Save</button>}
            </div>
          </div>
          {vehicle.images && vehicle.images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {vehicle.images.map((img) => (
                <div key={img.id} className="relative group">
                  <img src={img.url} alt="" className="w-full h-40 object-cover rounded-lg" />
                  {img.isPrimary && <span className="absolute top-2 left-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded">Primary</span>}
                  <button onClick={() => handleDeleteImage(img.id)} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No images uploaded</p>
          )}
        </div>
      )}
    </div>
  );
}
