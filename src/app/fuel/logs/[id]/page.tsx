'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Fuel, Calendar, Gauge, DollarSign, MapPin, User } from 'lucide-react';

export default function FuelLogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchLog = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fuel/logs/${id}`);
      const data = await res.json();
      if (data.success) setLog(data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (id) fetchLog(); }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center p-8 text-gray-500">
          <Fuel className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p>Fuel log not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => router.push('/fuel/logs')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Fuel Logs
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Fuel Log Detail</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            log.status === 'VERIFIED' ? 'bg-green-50 text-green-600' :
            log.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600' :
            log.status === 'DISPUTED' ? 'bg-red-50 text-red-600' :
            'bg-gray-50 text-gray-600'
          }`}>
            {log.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Fuel className="w-4 h-4" />
                <span className="text-sm">Fuel Type</span>
              </div>
              <p className="font-medium text-gray-900">{log.fuelType}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Gauge className="w-4 h-4" />
                <span className="text-sm">Quantity</span>
              </div>
              <p className="font-medium text-gray-900">{log.quantity.toFixed(1)} L</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Total Cost</span>
              </div>
              <p className="font-medium text-gray-900">KES {log.totalCost.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Date</span>
              </div>
              <p className="font-medium text-gray-900">
                {new Date(log.fuelDate).toLocaleString()}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Gauge className="w-4 h-4" />
                <span className="text-sm">Odometer</span>
              </div>
              <p className="font-medium text-gray-900">
                {log.odometerReading ? `${log.odometerReading} km` : '-'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Location</span>
              </div>
              <p className="font-medium text-gray-900">{log.location || '-'}</p>
            </div>
          </div>
        </div>

        {log.notes && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Notes</span>
            </div>
            <p className="text-gray-600">{log.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
