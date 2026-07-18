'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Eye } from 'lucide-react';

interface FuelLog {
  id: string;
  vehicle: { registrationNumber: string; make: string; model: string };
  driver?: { firstName: string; lastName: string };
  fuelType: string;
  quantity: number;
  totalCost: number;
  fuelDate: string;
  odometerReading?: number;
  status: string;
}

interface FuelLogTableProps {
  logs: FuelLog[];
  onDelete?: (id: string) => void;
}

export default function FuelLogTable({ logs, onDelete }: FuelLogTableProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Vehicle</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Driver</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Fuel Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Quantity</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Cost</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{log.vehicle.registrationNumber}</div>
                  <div className="text-gray-500 text-xs">{log.vehicle.make} {log.vehicle.model}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {log.driver ? `${log.driver.firstName} ${log.driver.lastName}` : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">{log.fuelType}</span>
                </td>
                <td className="px-4 py-3">{log.quantity.toFixed(1)} L</td>
                <td className="px-4 py-3">KES {log.totalCost.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(log.fuelDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    log.status === 'VERIFIED' ? 'bg-green-50 text-green-600' :
                    log.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600' :
                    log.status === 'DISPUTED' ? 'bg-red-50 text-red-600' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => router.push(`/fuel/logs/${log.id}`)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/fuel/logs/${log.id}/edit`)}
                      className="p-1 text-gray-400 hover:text-amber-600 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(log.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
