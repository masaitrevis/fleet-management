'use client';

import { useCallback } from 'react';
import { useMonitoring } from './useMonitoring';

interface ErrorHandlerResult {
  handleError: (error: Error, context?: Record<string, unknown>) => void;
  handleAsync: <T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T
  ) => (...args: Parameters<T>) => Promise<ReturnType<T> | undefined>;
}

export function useErrorHandler(): ErrorHandlerResult {
  const { errorTracking } = useMonitoring();

  const handleError = useCallback(
    (error: Error, context?: Record<string, unknown>) => {
      console.error('[useErrorHandler]', error);
      errorTracking.captureError(error, context);
    },
    [errorTracking]
  );

  const handleAsync = useCallback(
    <T extends (...args: unknown[]) => Promise<unknown>>(
      fn: T
    ): ((...args: Parameters<T>) => Promise<ReturnType<T> | undefined>) => {
      return async (...args: Parameters<T>) => {
        try {
          return (await fn(...args)) as ReturnType<T>;
        } catch (error) {
          handleError(error as Error, { function: fn.name, args });
          return undefined;
        }
      };
    },
    [handleError]
  );

  return { handleError, handleAsync };
}
