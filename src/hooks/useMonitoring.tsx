'use client';

import { createContext, useContext, ReactNode } from 'react';
import { MonitoringContextValue, noopProviders } from '@/lib/monitoring';

const MonitoringContext = createContext<MonitoringContextValue>(noopProviders);

export function MonitoringProvider({
  children,
  value = noopProviders,
}: {
  children: ReactNode;
  value?: MonitoringContextValue;
}) {
  return (
    <MonitoringContext.Provider value={value}>
      {children}
    </MonitoringContext.Provider>
  );
}

export function useMonitoring() {
  return useContext(MonitoringContext);
}
