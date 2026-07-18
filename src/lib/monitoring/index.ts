import type {
  MonitoringConfig,
  MonitoringContextValue,
  ErrorTrackingProvider,
  PerformanceMonitoringProvider,
  UserAnalyticsProvider,
  SessionReplayProvider,
} from './types';

export * from './types';
export { noopProviders, NoopErrorTrackingProvider, NoopPerformanceMonitoringProvider, NoopUserAnalyticsProvider, NoopSessionReplayProvider } from './noop-provider';
export {
  consoleProviders,
  ConsoleErrorTrackingProvider,
  ConsolePerformanceMonitoringProvider,
  ConsoleUserAnalyticsProvider,
  ConsoleSessionReplayProvider,
} from './console-provider';

import { noopProviders } from './noop-provider';
import { consoleProviders } from './console-provider';

export function createMonitoring(config: MonitoringConfig = {}): MonitoringContextValue {
  const {
    errorTracking,
    performance,
    analytics,
    sessionReplay,
    enabled = true,
    environment = 'development',
  } = config;

  if (!enabled) {
    return noopProviders;
  }

  if (environment === 'development') {
    return {
      errorTracking: errorTracking || consoleProviders.errorTracking,
      performance: performance || consoleProviders.performance,
      analytics: analytics || consoleProviders.analytics,
      sessionReplay: sessionReplay || consoleProviders.sessionReplay,
    };
  }

  return {
    errorTracking: errorTracking || noopProviders.errorTracking,
    performance: performance || noopProviders.performance,
    analytics: analytics || noopProviders.analytics,
    sessionReplay: sessionReplay || noopProviders.sessionReplay,
  };
}

export { MonitoringContextValue, ErrorTrackingProvider, PerformanceMonitoringProvider, UserAnalyticsProvider, SessionReplayProvider };
