'use client';

import { BarChart3 } from 'lucide-react';

export default function MaintenanceAnalyticsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-gray-700" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Analytics</h1>
          <p className="text-gray-600 mt-1">Cost analysis, downtime reports, and mechanic performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Total Cost', value: 'KES 0', color: 'text-blue-600' },
          { title: 'Total Downtime', value: '0 hrs', color: 'text-red-600' },
          { title: 'Active Work Orders', value: '0', color: 'text-green-600' },
          { title: 'Overdue', value: '0', color: 'text-orange-600' },
        ].map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">{stat.title}</p>
            <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Detailed analytics will be displayed here</p>
      </div>
    </div>
  );
}
