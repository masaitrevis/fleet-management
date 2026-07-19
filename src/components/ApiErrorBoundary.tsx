'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { WifiOff, ServerCrash, Lock, AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  statusCode: number | null;
  message: string;
}

const statusConfig: Record<number, { icon: typeof AlertTriangle; title: string; description: string }> = {
  400: { icon: AlertTriangle, title: 'Bad Request', description: 'The request was invalid. Please check your input and try again.' },
  401: { icon: Lock, title: 'Unauthorized', description: 'You need to sign in to access this page.' },
  403: { icon: Lock, title: 'Forbidden', description: 'You do not have permission to access this resource.' },
  404: { icon: AlertTriangle, title: 'Not Found', description: 'The page you are looking for does not exist.' },
  500: { icon: ServerCrash, title: 'Server Error', description: 'An internal server error occurred. Please try again later.' },
  502: { icon: ServerCrash, title: 'Bad Gateway', description: 'The server is temporarily unavailable. Please try again later.' },
  503: { icon: WifiOff, title: 'Service Unavailable', description: 'The service is temporarily down for maintenance.' },
  504: { icon: ServerCrash, title: 'Gateway Timeout', description: 'The request timed out. Please try again.' },
};

function getErrorInfo(statusCode: number) {
  return (
    statusConfig[statusCode] || {
      icon: AlertTriangle,
      title: 'Error',
      description: 'An unexpected error occurred. Please try again.',
    }
  );
}

export default class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, statusCode: null, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    let statusCode = 500;
    let message = error.message;

    // Try to extract status code from error message or name
    if (error.message.includes('404') || error.message.includes('not found')) {
      statusCode = 404;
    } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
      statusCode = 401;
    } else if (error.message.includes('403') || error.message.includes('forbidden')) {
      statusCode = 403;
    } else if (error.message.includes('500') || error.message.includes('internal')) {
      statusCode = 500;
    }

    return { hasError: true, statusCode, message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (typeof window !== 'undefined' && (window as any).__monitoring__?.logError) {
      (window as any).__monitoring__.logError(error, errorInfo);
    }
    if (process.env.NODE_ENV === 'development') {
      console.error('ApiErrorBoundary caught error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, statusCode: null, message: '' });
  };

  render() {
    if (this.state.hasError) {
      const { statusCode } = this.state;
      const info = getErrorInfo(statusCode ?? 500);
      const Icon = info.icon;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-700 mx-auto mb-4">
              <Icon className="h-6 w-6 text-gray-600 dark:text-slate-300" />
            </div>
            <div className="text-center mb-2">
              <span className="inline-block px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-700 text-xs font-mono text-gray-600 dark:text-slate-400 mb-2">
                {statusCode ?? '???'}
              </span>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {info.title}
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center mb-6">
              {info.description}
            </p>
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
