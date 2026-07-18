'use client';

import { Truck, Gauge, Clock, Navigation } from 'lucide-react';

interface LiveStatsProps {
  totalVehicles: number;
  onlineVehicles: number;
  idleVehicles: number;
  avgSpeed: number;
}

export default function LiveStats({ totalVehicles, onlineVehicles, idleVehicles, avgSpeed }: LiveStatsProps) {
  const stats = [
    { label: 'Total Vehicles', value: totalVehicles, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Online', value: onlineVehicles, icon: Navigation, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Idle', value: idleVehicles, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Avg Speed', value: `${avgSpeed.toFixed(1)} km/h`, icon: Gauge, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-sm">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        );
      })}
    </div>
  );
}
