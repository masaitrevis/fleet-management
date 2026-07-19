'use client';

import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Application Error
            </h2>
            <p className="text-sm text-gray-500 text-center mb-4">
              A critical error occurred and the application could not recover.
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-gray-400 text-center mb-6">
                Error ID: {error.digest}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
