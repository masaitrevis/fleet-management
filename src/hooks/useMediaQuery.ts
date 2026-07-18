'use client';

import { useEffect, useState, useCallback } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints: Record<Breakpoint, string> = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
};

export function useMediaQuery(breakpoint: Breakpoint): boolean {
  const [matches, setMatches] = useState(false);

  const getMatch = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(breakpoints[breakpoint]).matches;
  }, [breakpoint]);

  useEffect(() => {
    setMatches(getMatch());

    const mql = window.matchMedia(breakpoints[breakpoint]);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint, getMatch]);

  return matches;
}

// Hook for checking if the viewport is mobile (below md)
export function useIsMobile(): boolean {
  return !useMediaQuery('md');
}

// Hook for checking if the viewport is tablet or above
export function useIsTablet(): boolean {
  return useMediaQuery('md');
}

// Hook for checking if the viewport is desktop or above
export function useIsDesktop(): boolean {
  return useMediaQuery('lg');
}
