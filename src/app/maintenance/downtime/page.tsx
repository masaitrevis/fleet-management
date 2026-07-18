'use client';

import { useRouter } from 'next/navigation';
import { Plus, Clock } from 'lucide-react';

export default function VehicleDowntimePage() {
  const router = useRouter();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-gray-700" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Downtime</h1>
            <p className="text-gray-600 mt-1">Track vehicle availability and downtime</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/maintenance/downtime/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log Downtime
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Downtime records will be listed here</p>
      </div>
    </div>
  );
}
