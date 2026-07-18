'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(
    isOnline ? new Date() : null
  );
  const notifiedRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline((prev) => {
        if (prev) {
          // Show toast/notification when coming back online
          if (typeof window !== 'undefined' && (window as any).__toasts__?.add) {
            (window as any).__toasts__.add({
              type: 'success',
              message: 'You are back online',
            });
          }
          setLastOnlineAt(new Date());
          return true; // Keep wasOffline as true until explicitly reset
        }
        setLastOnlineAt(new Date());
        return false;
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      notifiedRef.current = true;

      // Show toast/notification when going offline
      if (typeof window !== 'undefined' && (window as any).__toasts__?.add) {
        (window as any).__toasts__.add({
          type: 'warning',
          message: 'You are offline. Some features may not work.',
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const resetWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  // Expose reset on the returned object for convenience
  return {
    isOnline,
    wasOffline,
    lastOnlineAt,
    // @ts-ignore - extending return type for convenience
    resetWasOffline,
  } as OnlineStatus;
}

// Simple notification helper for pages that don't have a toast system yet
export function showOfflineNotification(): void {
  if (typeof window === 'undefined') return;
  // Use native notification if available, otherwise console
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Fleet Management', {
      body: 'You are offline. Some features may not work.',
      icon: '/favicon.ico',
    });
  }
}
