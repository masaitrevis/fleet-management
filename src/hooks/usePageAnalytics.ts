'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useMonitoring } from './useMonitoring';

export function usePageAnalytics() {
  const { analytics } = useMonitoring();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const query = searchParams?.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;

    analytics.trackPageView(fullPath);
  }, [pathname, searchParams, analytics]);
}
