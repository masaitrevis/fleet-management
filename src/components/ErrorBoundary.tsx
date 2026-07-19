'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring interface if available
    if (typeof window !== 'undefined' && (window as any).__monitoring__?.logError) {
      (window as any).__monitoring__.logError(error, errorInfo);
    }
    // Call optional onError prop
    this.props.onError?.(error, errorInfo);
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center mb-6">
              An unexpected error occurred. You can try again or return to the dashboard.
            </p>
            {this.state.error && (
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 mb-6 overflow-auto">
                <pre className="text-xs text-red-600 dark:text-red-400 font-mono">
                  {this.state.error.message}
                </pre>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
