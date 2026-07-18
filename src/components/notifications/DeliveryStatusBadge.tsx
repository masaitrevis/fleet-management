import React from 'react';
import { CheckCircle, XCircle, Clock, Loader, Send, RotateCcw, Ban } from 'lucide-react';
import { DeliveryStatus } from '@prisma/client';

interface DeliveryStatusBadgeProps {
  status: DeliveryStatus;
}

export function DeliveryStatusBadge({ status }: DeliveryStatusBadgeProps) {
  const config: Record<DeliveryStatus, { label: string; icon: React.ReactNode; className: string }> = {
    QUEUED: { label: 'Queued', icon: <Clock className="w-3 h-3" />, className: 'bg-gray-100 text-gray-700' },
    PROCESSING: { label: 'Processing', icon: <Loader className="w-3 h-3 animate-spin" />, className: 'bg-blue-50 text-blue-700' },
    SENT: { label: 'Sent', icon: <Send className="w-3 h-3" />, className: 'bg-indigo-50 text-indigo-700' },
    DELIVERED: { label: 'Delivered', icon: <CheckCircle className="w-3 h-3" />, className: 'bg-green-50 text-green-700' },
    FAILED: { label: 'Failed', icon: <XCircle className="w-3 h-3" />, className: 'bg-red-50 text-red-700' },
    RETRYING: { label: 'Retrying', icon: <RotateCcw className="w-3 h-3" />, className: 'bg-amber-50 text-amber-700' },
    CANCELLED: { label: 'Cancelled', icon: <Ban className="w-3 h-3" />, className: 'bg-gray-100 text-gray-500' },
  };

  const { label, icon, className } = config[status] || config.QUEUED;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {icon}
      {label}
    </span>
  );
}
