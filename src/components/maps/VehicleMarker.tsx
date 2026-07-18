'use client';

import { Navigation } from 'lucide-react';

interface VehicleMarkerProps {
  lat: number;
  lng: number;
  heading?: number;
  status?: 'moving' | 'idle' | 'offline';
  label?: string;
  onClick?: () => void;
}

const statusColors = {
  moving: 'bg-green-500',
  idle: 'bg-amber-500',
  offline: 'bg-gray-400',
};

export default function VehicleMarker({ lat, lng, heading = 0, status = 'moving', label, onClick }: VehicleMarkerProps) {
  return (
    <div className="absolute cursor-pointer group" style={{ transform: `translate(-50%, -50%)` }} onClick={onClick}>
      <div className="relative">
        <div className={`w-8 h-8 rounded-full ${statusColors[status]} border-2 border-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-110`}>
          <Navigation className="w-4 h-4 text-white" style={{ transform: `rotate(${heading}deg)` }} />
        </div>
        {label && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
