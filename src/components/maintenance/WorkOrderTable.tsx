import React from 'react';
import { StatusIndicator } from './StatusIndicator';

interface WorkOrderTableProps {
  workOrders: Array<{
    id: string;
    workOrderNumber: string;
    title: string;
    status: string;
    priority: string;
    vehicle?: { registrationNumber?: string } | null;
    mechanic?: { firstName?: string; lastName?: string } | null;
    scheduledDate: Date | null;
    estimatedCost: number | null;
  }>;
}

export function WorkOrderTable({ workOrders }: WorkOrderTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">WO #</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mechanic</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Cost</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {workOrders.length === 0 && (
            <tr>
              <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                No work orders found
              </td>
            </tr>
          )}
          {workOrders.map((wo) => (
            <tr key={wo.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{wo.workOrderNumber}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{wo.title}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{wo.vehicle?.registrationNumber || '—'}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusIndicator status={wo.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusIndicator status={wo.priority} type="priority" />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {wo.mechanic ? `${wo.mechanic.firstName} ${wo.mechanic.lastName}` : '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                KES {wo.estimatedCost?.toLocaleString() || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
