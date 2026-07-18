'use client';

import { CalendarDays } from 'lucide-react';

export default function MaintenanceCalendarPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="w-6 h-6 text-gray-700" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Calendar</h1>
          <p className="text-gray-600 mt-1">View scheduled maintenance and work orders</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Calendar view will be implemented here</p>
      </div>
    </div>
  );
}
