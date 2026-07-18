import React from 'react';
import { MaintenancePriority, WorkOrderStatus, MaintenanceStatus } from '@prisma/client';

const priorityColors: Record<string, string> = {
  LOW: 'bg-blue-100 text-blue-800',
  NORMAL: 'bg-gray-100 text-gray-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
  CRITICAL: 'bg-red-200 text-red-900',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  WAITING_PARTS: 'bg-orange-100 text-orange-800',
  ON_HOLD: 'bg-gray-100 text-gray-800',
  COMPLETED: 'bg-green-200 text-green-900',
  CANCELLED: 'bg-red-100 text-red-800',
  FAILED_INSPECTION: 'bg-red-200 text-red-900',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  OVERDUE: 'bg-red-100 text-red-800',
  DEFERRED: 'bg-yellow-100 text-yellow-800',
};

interface StatusIndicatorProps {
  status: string;
  type?: 'priority' | 'status';
}

export function StatusIndicator({ status, type = 'status' }: StatusIndicatorProps) {
  const colors = type === 'priority' ? priorityColors : statusColors;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
