'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Route, Clock, AlertTriangle } from 'lucide-react';

interface RouteDetail {
  id: string;
  name: string;
  description?: string;
  startLocation: string;
  endLocation: string;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  distance?: number;
  estimatedDuration?: number;
  isActive: boolean;
  isOptimized: boolean;
  routeStops: any[];
  waypoints: any[];
}

export default function RouteDetailPage() {
  const params = useParams();
  const routeId = params?.id as string;
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRoute(); }, [routeId]);

  const fetchRoute = async () => {
    try {
      const res = await fetch(`/api/routes/${routeId}`);
      const data = await res.json();
      if (data.success) setRoute(data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!route) return (
    <div className="text-center py-12">
      <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">Route not found</p>
      <Link href="/dashboard/routes" className="text-blue-600 hover:underline mt-2 inline-block">Back to routes</Link>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/routes" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{route.name}</h1>
          <p className="text-gray-500">{route.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
            route.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {route.isActive ? 'Active' : 'Inactive'}
          </span>
          <Link href={`/dashboard/routes/${routeId}/edit`} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Edit</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Start Location</p>
                <p className="text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />{route.startLocation}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Location</p>
                <p className="text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />{route.endLocation}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Distance</p>
                <p className="text-gray-900">{route.distance ? `${route.distance} km` : '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estimated Duration</p>
                <p className="text-gray-900">{route.estimatedDuration ? `${route.estimatedDuration} min` : '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Coordinates</p>
                <p className="text-gray-900">{route.startLat ? `${route.startLat}, ${route.startLng}` : '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Coordinates</p>
                <p className="text-gray-900">{route.endLat ? `${route.endLat}, ${route.endLng}` : '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Optimized</p>
                <p className="text-gray-900">{route.isOptimized ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Stops ({route.routeStops.length})</h2>
            {route.routeStops.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No stops defined</p>
            ) : (
              <div className="space-y-4">
                {route.routeStops.map((stop, i) => (
                  <div key={stop.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{stop.name}</p>
                      <p className="text-sm text-gray-600">{stop.address}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">{stop.stopType}</span>
                        {stop.estimatedWaitTime && <span className="text-xs text-gray-500">Wait: {stop.estimatedWaitTime} min</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Waypoints</h2>
            {route.waypoints.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No waypoints defined</p>
            ) : (
              <div className="space-y-2">
                {route.waypoints.map((wp, i) => (
                  <div key={wp.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <span className="text-sm font-medium text-gray-500 w-6">{i + 1}</span>
                    <div className="text-sm text-gray-600">
                      {wp.latitude.toFixed(6)}, {wp.longitude.toFixed(6)}
                    </div>
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
