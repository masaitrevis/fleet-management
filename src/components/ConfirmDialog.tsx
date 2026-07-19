'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-50
    iconColor: 'text-red-500
    confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-50
    iconColor: 'text-amber-500
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
  },
  info: {
    icon: AlertTriangle,
    iconBg: 'bg-primary-50
    iconColor: 'text-primary-500
    confirmBtn: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
  },
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info',
}: ConfirmDialogProps) {
  const { trapRef, release } = useFocusTrap(isOpen);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          onCancel();
        }
      }}
      role="presentation"
    >
      <div
        ref={trapRef as any}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full',
                config.iconBg
              )}
            >
              <Icon className={cn('h-5 w-5', config.iconColor)} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3
                  id="confirm-dialog-title"
                  className="text-base font-semibold text-gray-900
                >
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-md p-1"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p
                id="confirm-dialog-message"
                className="text-sm text-gray-500
              >
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              release();
            }}
            className={cn(
              'px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
              config.confirmBtn
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
