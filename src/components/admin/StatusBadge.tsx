'use client';

interface StatusBadgeProps {
  status: 'active' | 'suspended' | 'pending' | 'trial' | 'expired' | 'healthy' | 'warning' | 'critical' | 'completed' | 'failed' | 'running' | 'queued' | 'success' | 'error' | 'info' | string;
  children?: React.ReactNode;
}

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  trial: 'bg-blue-50 text-blue-700 border-blue-200',
  expired: 'bg-gray-100 text-gray-700 border-gray-200',
  healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  running: 'bg-blue-50 text-blue-700 border-blue-200',
  queued: 'bg-gray-100 text-gray-700 border-gray-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function StatusBadge({ status, children }: StatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {children || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
