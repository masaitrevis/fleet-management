'use client';

import { Gauge, Fuel, Battery, Thermometer, Activity, Clock } from 'lucide-react';

interface TelemetryPanelProps {
  speed?: number;
  fuelLevel?: number;
  batteryVoltage?: number;
  temperature?: number;
  engineHours?: number;
  ignition?: boolean;
  odometer?: number;
}

export default function TelemetryPanel({
  speed,
  fuelLevel,
  batteryVoltage,
  temperature,
  engineHours,
  ignition,
  odometer,
}: TelemetryPanelProps) {
  const items = [
    { label: 'Speed', value: speed != null ? `${speed} km/h` : 'N/A', icon: Gauge },
    { label: 'Fuel', value: fuelLevel != null ? `${fuelLevel}%` : 'N/A', icon: Fuel },
    { label: 'Battery', value: batteryVoltage != null ? `${batteryVoltage}V` : 'N/A', icon: Battery },
    { label: 'Temp', value: temperature != null ? `${temperature}°C` : 'N/A', icon: Thermometer },
    { label: 'Engine Hours', value: engineHours != null ? `${engineHours}h` : 'N/A', icon: Clock },
    { label: 'Odometer', value: odometer != null ? `${odometer} km` : 'N/A', icon: Activity },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Telemetry</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ignition ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
          {ignition ? 'Engine ON' : 'Engine OFF'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
              <Icon className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-sm font-medium text-gray-900">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
