import type {
  ErrorTrackingProvider,
  PerformanceMonitoringProvider,
  UserAnalyticsProvider,
  SessionReplayProvider,
} from './types';

export class NoopErrorTrackingProvider implements ErrorTrackingProvider {
  captureError(): void {
    // no-op
  }
  captureMessage(): void {
    // no-op
  }
  setUser(): void {
    // no-op
  }
}

export class NoopPerformanceMonitoringProvider implements PerformanceMonitoringProvider {
  trackWebVital(): void {
    // no-op
  }
  trackCustomMetric(): void {
    // no-op
  }
  startTrace() {
    return {
      stop(): void {
        // no-op
      },
    };
  }
}

export class NoopUserAnalyticsProvider implements UserAnalyticsProvider {
  trackEvent(): void {
    // no-op
  }
  trackPageView(): void {
    // no-op
  }
  identify(): void {
    // no-op
  }
}

export class NoopSessionReplayProvider implements SessionReplayProvider {
  startRecording(): void {
    // no-op
  }
  stopRecording(): void {
    // no-op
  }
  captureSnapshot(): void {
    // no-op
  }
}

export const noopProviders = {
  errorTracking: new NoopErrorTrackingProvider(),
  performance: new NoopPerformanceMonitoringProvider(),
  analytics: new NoopUserAnalyticsProvider(),
  sessionReplay: new NoopSessionReplayProvider(),
};
