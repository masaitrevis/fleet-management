'use client';

import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { SecurityEventSeverity } from '@/modules/platform-admin/types';

interface SecurityAlertCardProps {
  type: string;
  severity: SecurityEventSeverity;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  onResolve?: () => void;
  resolved?: boolean;
}

const severityConfig = {
  LOW: { icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  MEDIUM: { icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  HIGH: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
  CRITICAL: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
};

export default function SecurityAlertCard({ type, severity, details, ipAddress, createdAt, onResolve, resolved }: SecurityAlertCardProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{type.replace(/_/g, ' ')}</h4>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color} ${config.bg}`}>{severity}</span>
          </div>
          {details && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{details}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
            {ipAddress && <span>IP: {ipAddress}</span>}
            <span>{new Date(createdAt).toLocaleString()}</span>
          </div>
          {onResolve && !resolved && (
            <button
              onClick={onResolve}
              className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Mark as resolved
            </button>
          )}
          {resolved && (
            <span className="mt-2 inline-block text-xs text-emerald-600 dark:text-emerald-400 font-medium">Resolved</span>
          )}
        </div>
      </div>
    </div>
  );
}
