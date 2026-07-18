'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Fuel, BarChart3 } from 'lucide-react';

export default function FuelAnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fuel/analytics/overview');
      const data = await res.json();
      if (data.success) setOverview(data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOverview(); }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fuel Analytics</h1>
        <p className="text-gray-600 mt-1">Consumption trends, efficiency, and cost analysis</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Fuel className="w-4 h-4" />
                <span className="text-sm">Total Consumed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {(overview.totalFuelConsumed || 0).toFixed(1)} L
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Total Cost</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                KES {(overview.totalFuelCost || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Avg Consumption</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {(overview.averageConsumption || 0).toFixed(1)} L/100km
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Cost per km</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                KES {(overview.averageCostPerKm || 0).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Consumption by Vehicle</h2>
              <div className="space-y-3">
                {(overview.vehicleStats || []).slice(0, 5).map((v: any) => (
                  <div key={v.vehicleId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{v.vehicle?.registrationNumber || 'Unknown'}</div>
                      <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min((v.totalFuelConsumed / (overview.totalFuelConsumed || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 ml-4">{v.totalFuelConsumed.toFixed(1)} L</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Consumption by Driver</h2>
              <div className="space-y-3">
                {(overview.driverStats || []).slice(0, 5).map((d: any) => (
                  <div key={d.driverId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {d.driver ? `${d.driver.firstName} ${d.driver.lastName}` : 'Unknown'}
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${Math.min((d.totalFuelConsumed / (overview.totalFuelConsumed || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 ml-4">{d.totalFuelConsumed.toFixed(1)} L</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center p-8 text-gray-500">
          <BarChart3 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p>No analytics data available</p>
        </div>
      )}
    </div>
  );
}
