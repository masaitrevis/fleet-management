'use client';

interface SystemHealthIndicatorProps {
  label: string;
  status: 'healthy' | 'warning' | 'critical';
  detail?: string;
}

const statusConfig = {
  healthy: { dot: 'bg-emerald-500', label: 'text-emerald-700', bg: 'bg-emerald-50' },
  warning: { dot: 'bg-amber-500', label: 'text-amber-700', bg: 'bg-amber-50' },
  critical: { dot: 'bg-red-500', label: 'text-red-700', bg: 'bg-red-50' },
};

export default function SystemHealthIndicator({ label, status, detail }: SystemHealthIndicatorProps) {
  const config = statusConfig[status];
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${config.bg}`}>
      <span className={`relative flex h-2.5 w-2.5`}>
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75`} />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.dot}`} />
      </span>
      <div className="min-w-0">
        <span className={`text-sm font-medium ${config.label}`}>{label}</span>
        {detail && <span className="text-xs text-gray-500 ml-2">{detail}</span>}
      </div>
    </div>
  );
}
