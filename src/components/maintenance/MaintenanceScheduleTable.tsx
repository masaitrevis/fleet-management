import React from 'react';

interface MaintenanceScheduleTableProps {
  schedules: Array<{
    id: string;
    name: string;
    vehicle?: { registrationNumber?: string } | null;
    scheduleType: string;
    nextDueDate: Date | null;
    nextDueOdometer: number | null;
    isActive: boolean;
  }>;
}

export function MaintenanceScheduleTable({ schedules }: MaintenanceScheduleTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Due</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Odometer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {schedules.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                No schedules found
              </td>
            </tr>
          )}
          {schedules.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {s.vehicle?.registrationNumber || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.scheduleType.replace(/_/g, ' ')}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {s.nextDueDate ? new Date(s.nextDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {s.nextDueOdometer?.toLocaleString() || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
