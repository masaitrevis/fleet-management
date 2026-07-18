import React from 'react';
import { StatusIndicator } from './StatusIndicator';

interface VehicleDowntimeTableProps {
  downtimes: Array<{
    id: string;
    vehicle?: { registrationNumber?: string } | null;
    reason: string;
    startDate: Date;
    endDate: Date | null;
    totalHours: number | null;
    description: string | null;
  }>;
}

export function VehicleDowntimeTable({ downtimes }: VehicleDowntimeTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {downtimes.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                No downtime records found
              </td>
            </tr>
          )}
          {downtimes.map((d) => (
            <tr key={d.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {d.vehicle?.registrationNumber || 'Unknown'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusIndicator status={d.reason} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(d.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {d.endDate ? new Date(d.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {d.totalHours?.toFixed(1) || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">
                {d.description || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
