'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Activity, Gauge, Fuel, Battery, AlertTriangle, TrendingUp } from 'lucide-react';

interface TelemetryStats {
  avgSpeed: number | null;
  maxSpeed: number | null;
  totalDistance: number | null;
  avgFuelLevel: number | null;
  avgBatteryVoltage: number | null;
  maxOdometer: number | null;
  minOdometer: number | null;
  totalReadings: number;
  harshEvents: {
    braking: number;
    acceleration: number;
    cornering: number;
    overspeed: number;
  };
}

export default function TelemetryPage() {
  const [vehicleId, setVehicleId] = useState('');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchVehicles();
    const vId = searchParams?.get('vehicleId');
    if (vId) { setVehicleId(vId); fetchTelemetry(vId); }
  }, []);

  const fetchVehicles = async () => {
    try { const res = await fetch('/api/vehicles'); const data = await res.json(); if (data.success) setVehicles(data.data.vehicles || []); }
    catch (error) { console.error(error); }
  };

  const fetchTelemetry = async (vId: string) => {
    setLoading(true);
    try {
      const [statsRes, telemRes] = await Promise.all([
        fetch(`/api/telemetry/${vId}/stats`),
        fetch(`/api/telemetry/${vId}`),
      ]);
      const statsData = await statsRes.json();
      const telemData = await telemRes.json();
      if (statsData.success) setStats(statsData.data);
      if (telemData.success) setTelemetry(telemData.data.telemetry || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Telemetry Dashboard</h1>
          <p className="text-gray-600 mt-1">Vehicle diagnostics and telemetry data</p>
        </div>
        <select
          value={vehicleId}
          onChange={(e) => { setVehicleId(e.target.value); if (e.target.value) fetchTelemetry(e.target.value); }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select vehicle...</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.registrationNumber} - {v.make} {v.model}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2"><Gauge className="w-4 h-4" /><span className="text-sm">Avg Speed</span></div>
              <p className="text-2xl font-bold text-gray-900">{(stats.avgSpeed || 0).toFixed(1)} <span className="text-sm font-normal text-gray-500">km/h</span></p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2"><TrendingUp className="w-4 h-4" /><span className="text-sm">Max Speed</span></div>
              <p className="text-2xl font-bold text-gray-900">{(stats.maxSpeed || 0).toFixed(1)} <span className="text-sm font-normal text-gray-500">km/h</span></p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2"><Activity className="w-4 h-4" /><span className="text-sm">Distance</span></div>
              <p className="text-2xl font-bold text-gray-900">{(stats.totalDistance || 0).toFixed(1)} <span className="text-sm font-normal text-gray-500">km</span></p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2"><Fuel className="w-4 h-4" /><span className="text-sm">Avg Fuel</span></div>
              <p className="text-2xl font-bold text-gray-900">{(stats.avgFuelLevel || 0).toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2"><Battery className="w-4 h-4" /><span className="text-sm">Battery Voltage</span></div>
              <p className="text-2xl font-bold text-gray-900">{(stats.avgBatteryVoltage || 0).toFixed(2)}V</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2"><AlertTriangle className="w-4 h-4" /><span className="text-sm">Harsh Braking</span></div>
              <p className="text-2xl font-bold text-gray-900">{stats.harshEvents.braking}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2"><TrendingUp className="w-4 h-4" /><span className="text-sm">Harsh Acceleration</span></div>
              <p className="text-2xl font-bold text-gray-900">{stats.harshEvents.acceleration}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2"><AlertTriangle className="w-4 h-4" /><span className="text-sm">Overspeed Events</span></div>
              <p className="text-2xl font-bold text-gray-900">{stats.harshEvents.overspeed}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Recent Telemetry Readings</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Time</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Speed</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Fuel</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Odometer</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Engine</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Events</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {telemetry.slice(0, 20).map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{new Date(t.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3">{t.speed != null ? `${t.speed} km/h` : '-'}</td>
                      <td className="px-4 py-3">{t.fuelLevel != null ? `${t.fuelLevel}%` : '-'}</td>
                      <td className="px-4 py-3">{t.odometer != null ? `${t.odometer} km` : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.ignition ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                          {t.ignition ? 'ON' : 'OFF'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {t.harshBraking && <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-xs">Brake</span>}
                          {t.harshAcceleration && <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-xs">Accel</span>}
                          {t.overspeed && <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-xs">Speed</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center p-8 text-gray-500">
          <Activity className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p>Select a vehicle to view telemetry data</p>
        </div>
      )}
    </div>
  );
}
