'use client';

import { useEffect } from 'react';
import { useMonitoring } from './useMonitoring';

type WebVitalName = 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (name) {
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    case 'FID':
      return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    case 'FCP':
      return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
    case 'INP':
      return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
    default:
      return 'good';
  }
}

function observeWebVital(name: WebVitalName, callback: (metric: { name: string; value: number; rating: 'good' | 'needs-improvement' | 'poor' }) => void) {
  if (typeof window === 'undefined') return;

  if (name === 'CLS') {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        callback({ name: 'CLS', value: clsValue, rating: getRating('CLS', clsValue) });
      }
    });
    return;
  }

  if (name === 'LCP') {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry;
      callback({ name: 'LCP', value: lastEntry.startTime, rating: getRating('LCP', lastEntry.startTime) });
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    return;
  }

  if (name === 'FCP') {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0] as PerformanceEntry;
      callback({ name: 'FCP', value: firstEntry.startTime, rating: getRating('FCP', firstEntry.startTime) });
    });
    observer.observe({ type: 'paint', buffered: true });
    return;
  }

  if (name === 'INP') {
    let inpValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const interactionTime = (entry as any).processingEnd - (entry as any).startTime;
        if (interactionTime > inpValue) {
          inpValue = interactionTime;
        }
      }
    });
    observer.observe({ type: 'event', buffered: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        callback({ name: 'INP', value: inpValue, rating: getRating('INP', inpValue) });
      }
    });
    return;
  }

  if (name === 'FID') {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const delay = (entry as any).processingStart - (entry as any).startTime;
        callback({ name: 'FID', value: delay, rating: getRating('FID', delay) });
      }
    });
    observer.observe({ type: 'first-input', buffered: true });
    return;
  }

  if (name === 'TTFB') {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navigation) {
      const value = navigation.responseStart - navigation.startTime;
      callback({ name: 'TTFB', value, rating: getRating('TTFB', value) });
    }
    return;
  }
}

export function useWebVitals() {
  const { performance } = useMonitoring();

  useEffect(() => {
    const vitals: WebVitalName[] = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'];
    const cleanups: (() => void)[] = [];

    vitals.forEach((vital) => {
      observeWebVital(vital, (metric) => {
        performance.trackWebVital(metric.name, metric.value, metric.rating);
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [performance]);
}
