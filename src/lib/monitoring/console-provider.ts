import type {
  ErrorTrackingProvider,
  PerformanceMonitoringProvider,
  UserAnalyticsProvider,
  SessionReplayProvider,
} from './types';

export class ConsoleErrorTrackingProvider implements ErrorTrackingProvider {
  captureError(error: Error, context?: Record<string, unknown>): void {
    console.error('[ErrorTracking]', error.message, { stack: error.stack, ...context });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    const fn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
    fn('[ErrorTracking]', message);
  }

  setUser(user: { id: string; email?: string } | null): void {
    console.log('[ErrorTracking] User set:', user);
  }
}

export class ConsolePerformanceMonitoringProvider implements PerformanceMonitoringProvider {
  trackWebVital(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor'): void {
    console.log('[Performance]', { name, value, rating });
  }

  trackCustomMetric(name: string, value: number, unit?: string): void {
    console.log('[Performance]', { name, value, unit });
  }

  startTrace(name: string) {
    const start = performance.now();
    return {
      stop(): void {
        const duration = performance.now() - start;
        console.log('[Performance]', { trace: name, duration: `${duration.toFixed(2)}ms` });
      },
    };
  }
}

export class ConsoleUserAnalyticsProvider implements UserAnalyticsProvider {
  trackEvent(event: string, properties?: Record<string, unknown>): void {
    console.log('[Analytics]', { event, ...properties });
  }

  trackPageView(path: string): void {
    console.log('[Analytics]', { pageView: path });
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    console.log('[Analytics]', { identify: userId, ...traits });
  }
}

export class ConsoleSessionReplayProvider implements SessionReplayProvider {
  startRecording(): void {
    console.log('[SessionReplay] Recording started');
  }

  stopRecording(): void {
    console.log('[SessionReplay] Recording stopped');
  }

  captureSnapshot(): void {
    console.log('[SessionReplay] Snapshot captured');
  }
}

export const consoleProviders = {
  errorTracking: new ConsoleErrorTrackingProvider(),
  performance: new ConsolePerformanceMonitoringProvider(),
  analytics: new ConsoleUserAnalyticsProvider(),
  sessionReplay: new ConsoleSessionReplayProvider(),
};
