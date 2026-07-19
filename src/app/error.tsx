'use client';

import { useEffect } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Root error:', error);
    }
  }, [error]);

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Page Error
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              {error.message || 'An unexpected error occurred while loading this page.'}
            </p>
            <button
              onClick={reset}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      }
    >
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Page Error
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            {error.message || 'An unexpected error occurred while loading this page.'}
          </p>
          <button
            onClick={reset}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}
