'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Radio, AlertTriangle, Battery, Gauge, ChevronLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface VehicleLocation {
  id: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  batteryLevel?: number;
  ignition?: boolean;
  address?: string;
  timestamp: string;
  vehicle?: { registrationNumber: string; make: string; model: string };
}

export default function LiveMapPage() {
  const [vehicles, setVehicles] = useState<VehicleLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/live/vehicles');
      const data = await res.json();
      if (data.success) setVehicles(data.data || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Fleet Map</h1>
          <p className="text-gray-600">Real-time vehicle locations ({vehicles.length} online)</p>
        </div>
        <button onClick={fetchVehicles} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
        <div className="lg:col-span-3 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center relative overflow-hidden">
          <div className="text-center p-8">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Map View</p>
            <p className="text-sm text-gray-400 mt-2">Connect Google Maps or Mapbox to render live vehicle markers</p>
            <div className="mt-6 space-y-2">
              {vehicles.slice(0, 5).map((v) => (
                <button key={v.id} onClick={() => setSelectedVehicle(v.vehicleId)} className="flex items-center gap-3 w-full text-left px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-sm font-medium">{v.vehicle?.registrationNumber || v.vehicleId.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500">{v.speed != null ? `${v.speed} km/h` : 'Stationary'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Vehicle List</h2>
          </div>
          <div className="overflow-y-auto max-h-[calc(100%-4rem)]">
            {vehicles.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No vehicles reporting location</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {vehicles.map((v) => (
                  <div key={v.id} className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedVehicle === v.vehicleId ? 'bg-blue-50' : ''}`} onClick={() => setSelectedVehicle(v.vehicleId)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900">{v.vehicle?.registrationNumber || v.vehicleId.slice(0, 8)}</span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${v.ignition ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      {v.speed != null && <div className="flex items-center gap-1"><Gauge className="w-3 h-3" />{v.speed} km/h</div>}
                      {v.batteryLevel != null && <div className="flex items-center gap-1"><Battery className="w-3 h-3" />{v.batteryLevel}%</div>}
                      {v.address && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{v.address}</div>}
                      <div className="text-xs text-gray-400">{new Date(v.timestamp).toLocaleString()}</div>
                    </div>
                    <Link href={`/dashboard/live/vehicle/${v.vehicleId}`} className="mt-2 text-sm text-blue-600 hover:underline">View details →</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
