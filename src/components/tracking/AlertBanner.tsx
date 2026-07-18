'use client';

import { AlertTriangle, X, AlertOctagon, Info, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface AlertBannerProps {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  onDismiss?: () => void;
}

const config = {
  error: { icon: AlertOctagon, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  info: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  success: { icon: CheckCircle, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
};

export default function AlertBanner({ type, message, onDismiss }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const { icon: Icon, bg, text, border } = config[type];

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bg} ${text} ${border}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm flex-1">{message}</p>
      {onDismiss && (
        <button onClick={() => { setDismissed(true); onDismiss(); }} className="p-1 rounded hover:bg-black/5">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
