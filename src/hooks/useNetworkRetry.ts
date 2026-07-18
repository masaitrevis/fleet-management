'use client';

import { useCallback, useRef } from 'react';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  jitter?: boolean;
}

interface RetryState {
  attempt: number;
  isRetrying: boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, baseDelay: number, maxDelay: number, jitter: boolean): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponential = baseDelay * Math.pow(2, attempt);
  const clamped = Math.min(exponential, maxDelay);

  if (jitter) {
    // Add random jitter: ±25% of the delay
    const jitterAmount = clamped * 0.25;
    return clamped + (Math.random() * jitterAmount * 2 - jitterAmount);
  }

  return clamped;
}

export function useNetworkRetry(options: RetryOptions = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    jitter = true,
  } = options;

  const stateRef = useRef<RetryState>({ attempt: 0, isRetrying: false });

  const retry = useCallback(
    async <T>(fetchFn: () => Promise<T>): Promise<T> => {
      stateRef.current = { attempt: 0, isRetrying: true };

      while (stateRef.current.attempt <= maxRetries) {
        try {
          const result = await fetchFn();
          stateRef.current.isRetrying = false;
          return result;
        } catch (error) {
          const attempt = stateRef.current.attempt;

          if (attempt >= maxRetries) {
            stateRef.current.isRetrying = false;
            throw error;
          }

          const delay = calculateDelay(attempt, baseDelay, maxDelay, jitter);
          stateRef.current.attempt = attempt + 1;
          await sleep(delay);
        }
      }

      stateRef.current.isRetrying = false;
      throw new Error('Max retries exceeded');
    },
    [maxRetries, baseDelay, maxDelay, jitter]
  );

  const getState = useCallback(() => ({ ...stateRef.current }), []);

  return { retry, getState };
}

export type { RetryOptions };
