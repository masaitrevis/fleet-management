import React from 'react';
import { StatusIndicator } from './StatusIndicator';

interface MaintenanceRecordTableProps {
  records: Array<{
    id: string;
    vehicle?: { registrationNumber?: string; make?: string; model?: string } | null;
    status: string;
    priority: string;
    serviceDate: Date | null;
    totalCost: number | null;
    workOrder?: { workOrderNumber?: string } | null;
  }>;
}

export function MaintenanceRecordTable({ records }: MaintenanceRecordTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Order</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {records.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                No maintenance records found
              </td>
            </tr>
          )}
          {records.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {record.vehicle?.registrationNumber || 'Unknown'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusIndicator status={record.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusIndicator status={record.priority} type="priority" />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {record.serviceDate ? new Date(record.serviceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                KES {record.totalCost?.toLocaleString() || '0'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {record.workOrder?.workOrderNumber || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
