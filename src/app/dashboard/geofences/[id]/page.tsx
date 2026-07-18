'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Map, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Geofence {
  id: string;
  name: string;
  description?: string;
  type: string;
  coordinates: any;
  radius?: number;
  isActive: boolean;
  alertType: string;
  speedLimit?: number;
  vehicles: string[];
  createdAt: string;
  updatedAt: string;
}

export default function GeofenceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [geofence, setGeofence] = useState<Geofence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGeofence();
  }, [id]);

  const fetchGeofence = async () => {
    try {
      const res = await fetch(`/api/geofences/${id}`);
      const data = await res.json();
      if (data.success) setGeofence(data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!geofence) return (
    <div className="text-center p-8">
      <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
      <p className="text-gray-500">Geofence not found</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard/geofences" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">{geofence.name}</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-600" />
            <span className="font-semibold">Geofence Details</span>
          </div>
          {geofence.isActive ? (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">Active</span>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Inactive</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Type</p>
            <p className="font-medium">{geofence.type}</p>
          </div>
          <div>
            <p className="text-gray-500">Alert Type</p>
            <p className="font-medium">{geofence.alertType}</p>
          </div>
          <div>
            <p className="text-gray-500">Radius</p>
            <p className="font-medium">{geofence.radius ? `${geofence.radius}m` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Speed Limit</p>
            <p className="font-medium">{geofence.speedLimit ? `${geofence.speedLimit} km/h` : 'None'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Description</p>
            <p className="font-medium">{geofence.description || 'No description'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Monitored Vehicles</p>
            <p className="font-medium">{geofence.vehicles.length > 0 ? geofence.vehicles.join(', ') : 'All vehicles'}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Coordinates</p>
          <pre className="text-xs text-gray-600 overflow-x-auto">{JSON.stringify(geofence.coordinates, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
