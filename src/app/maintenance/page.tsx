'use client';

import { useRouter } from 'next/navigation';
import { Wrench, Calendar, ClipboardList, Users, BarChart3, AlertTriangle } from 'lucide-react';

export default function MaintenanceDashboardPage() {
  const router = useRouter();

  const cards = [
    { title: 'Work Orders', count: 0, icon: ClipboardList, path: '/maintenance/work-orders', color: 'bg-blue-500' },
    { title: 'Maintenance Records', count: 0, icon: Wrench, path: '/maintenance/records', color: 'bg-green-500' },
    { title: 'Schedules', count: 0, icon: Calendar, path: '/maintenance/schedules', color: 'bg-purple-500' },
    { title: 'Mechanics', count: 0, icon: Users, path: '/maintenance/mechanics', color: 'bg-orange-500' },
    { title: 'Overdue', count: 0, icon: AlertTriangle, path: '/maintenance/analytics', color: 'bg-red-500' },
    { title: 'Analytics', count: 0, icon: BarChart3, path: '/maintenance/analytics', color: 'bg-indigo-500' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage work orders, schedules, and vehicle maintenance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <button
            key={card.title}
            onClick={() => router.push(card.path)}
            className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className={`${card.color} p-3 rounded-lg`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.count}</p>
              <p className="text-sm text-gray-600">{card.title}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
