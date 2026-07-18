export interface ErrorTrackingProvider {
  captureError(error: Error, context?: Record<string, unknown>): void;
  captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void;
  setUser(user: { id: string; email?: string } | null): void;
}

export interface PerformanceMonitoringProvider {
  trackWebVital(
    name: string,
    value: number,
    rating: 'good' | 'needs-improvement' | 'poor'
  ): void;
  trackCustomMetric(name: string, value: number, unit?: string): void;
  startTrace(name: string): { stop(): void };
}

export interface UserAnalyticsProvider {
  trackEvent(event: string, properties?: Record<string, unknown>): void;
  trackPageView(path: string): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
}

export interface SessionReplayProvider {
  startRecording(): void;
  stopRecording(): void;
  captureSnapshot(): void;
}

export interface MonitoringConfig {
  errorTracking?: ErrorTrackingProvider;
  performance?: PerformanceMonitoringProvider;
  analytics?: UserAnalyticsProvider;
  sessionReplay?: SessionReplayProvider;
  enabled?: boolean;
  environment?: 'development' | 'production' | 'test';
}

export interface MonitoringContextValue {
  errorTracking: ErrorTrackingProvider;
  performance: PerformanceMonitoringProvider;
  analytics: UserAnalyticsProvider;
  sessionReplay: SessionReplayProvider;
}
