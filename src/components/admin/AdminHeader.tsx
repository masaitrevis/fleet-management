'use client';

import { Bell, Search } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
        </div>
        <button className="relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800">
          <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}
