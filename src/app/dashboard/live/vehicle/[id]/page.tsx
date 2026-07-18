'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Navigation, Battery, Gauge, ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface VehicleLocation {
  id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  accuracy?: number;
  batteryLevel?: number;
  ignition?: boolean;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  timestamp: string;
}

export default function VehicleTrackerPage() {
  const params = useParams();
  const id = params?.id as string;
  const [location, setLocation] = useState<VehicleLocation | null>(null);
  const [history, setHistory] = useState<VehicleLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchData = async () => {
    try {
      const [locRes, histRes] = await Promise.all([
        fetch(`/api/live/vehicle/${id}`),
        fetch(`/api/history/${id}?limit=50`),
      ]);
      const locData = await locRes.json();
      const histData = await histRes.json();
      if (locData.success) setLocation(locData.data);
      if (histData.success) setHistory(histData.data.locations || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard/live" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Tracker</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-100 rounded-xl border border-gray-200 h-96 flex items-center justify-center">
          {location ? (
            <div className="text-center p-8">
              <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <p className="font-medium text-gray-900">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
              {location.address && <p className="text-gray-600 mt-1">{location.address}</p>}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {location.speed != null && <span className="px-3 py-1 bg-white rounded-full text-sm font-medium">{location.speed} km/h</span>}
                {location.heading != null && <span className="px-3 py-1 bg-white rounded-full text-sm font-medium">Heading: {location.heading}°</span>}
                {location.altitude != null && <span className="px-3 py-1 bg-white rounded-full text-sm font-medium">Alt: {location.altitude}m</span>}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No recent location data</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Current Status</h2>
            {location ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-gray-600">Ignition</span><span className={`font-medium ${location.ignition ? 'text-green-600' : 'text-gray-500'}`}>{location.ignition ? 'ON' : 'OFF'}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Battery</span><span className="font-medium">{location.batteryLevel != null ? `${location.batteryLevel}%` : 'N/A'}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Accuracy</span><span className="font-medium">{location.accuracy != null ? `${location.accuracy}m` : 'N/A'}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Updated</span><span className="font-medium">{new Date(location.timestamp).toLocaleString()}</span></div>
              </div>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Location History</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map((h) => (
                <div key={h.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}</p>
                    {h.speed != null && <p className="text-gray-500">{h.speed} km/h</p>}
                    <p className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {history.length === 0 && <p className="text-gray-500 text-sm">No history available</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
