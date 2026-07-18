import React from 'react';
import { StatusIndicator } from './StatusIndicator';

interface MechanicTableProps {
  mechanics: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    employeeId: string | null;
    status: string;
    hourlyRate: number | null;
    skills: string[];
  }>;
}

export function MechanicTable({ mechanics }: MechanicTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hourly Rate</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skills</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {mechanics.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                No mechanics found
              </td>
            </tr>
          )}
          {mechanics.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {m.firstName} {m.lastName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{m.employeeId || '—'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{m.email || '—'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{m.phone || '—'}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusIndicator status={m.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                KES {m.hourlyRate?.toLocaleString() || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {m.skills?.join(', ') || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
