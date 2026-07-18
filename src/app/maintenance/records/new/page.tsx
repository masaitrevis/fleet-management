'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Wrench } from 'lucide-react';

export default function NewMaintenanceRecordPage() {
  const router = useRouter();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => router.push('/maintenance/records')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Records
      </button>

      <div className="flex items-center gap-3 mb-6">
        <Wrench className="w-6 h-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">New Maintenance Record</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <p className="text-gray-500">Maintenance record form will be implemented here</p>
      </div>
    </div>
  );
}
