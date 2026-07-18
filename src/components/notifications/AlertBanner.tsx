import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface AlertBannerProps {
  message: string;
  type?: 'critical' | 'warning' | 'info';
  onDismiss?: () => void;
}

export function AlertBanner({ message, type = 'warning', onDismiss }: AlertBannerProps) {
  const colors = {
    critical: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${colors[type]}`}>
      <AlertTriangle className="w-5 h-5 shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
