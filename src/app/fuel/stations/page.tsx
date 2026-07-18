'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MapPin } from 'lucide-react';

export default function FuelStationsPage() {
  const router = useRouter();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fuel/stations');
      const data = await res.json();
      if (data.success) setStations(data.data.stations || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStations(); }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuel Stations</h1>
          <p className="text-gray-600 mt-1">Manage fuel station locations</p>
        </div>
        <button
          onClick={() => router.push('/fuel/stations/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Station
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Brand</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Location</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stations.map((station: any) => (
                  <tr key={station.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{station.name}</td>
                    <td className="px-4 py-3">{station.brand || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {station.city || station.address || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        station.status === 'ACTIVE' ? 'bg-green-50 text-green-600' :
                        station.status === 'INACTIVE' ? 'bg-gray-50 text-gray-600' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>
                        {station.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
