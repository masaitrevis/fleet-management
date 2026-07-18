'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardList } from 'lucide-react';

export default function NewWorkOrderPage() {
  const router = useRouter();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => router.push('/maintenance/work-orders')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Work Orders
      </button>

      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="w-6 h-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">New Work Order</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <p className="text-gray-500">Work order form will be implemented here</p>
      </div>
    </div>
  );
}
