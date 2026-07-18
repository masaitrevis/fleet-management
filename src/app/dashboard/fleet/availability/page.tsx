'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Truck, User, CheckCircle, Wrench, AlertTriangle, Ban, CalendarDays, ArrowRightLeft, MapPin } from 'lucide-react';

interface AvailabilityData {
  vehicles: {
    total: number;
    active: number;
    inMaintenance: number;
    reserved: number;
    outOfService: number;
    assigned: number;
    available: number;
    expiredInspections: number;
  };
  drivers: {
    total: number;
    active: number;
    suspended: number;
    onLeave: number;
    terminated: number;
    assigned: number;
    available: number;
    expiredLicenses: number;
  };
  assignments: {
    total: number;
    list: Array<{
      id: string;
      assignmentType: string;
      assignedAt: string;
      vehicle: { id: string; registrationNumber: string; make: string; model: string; status: string };
      driver: { id: string; firstName: string; lastName: string; email: string; status: string; employeeId?: string };
      branch?: { id: string; name: string };
    }>;
  };
}

const typeConfig: Record<string, { color: string; bg: string; label: string }> = {
  PRIMARY: { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Primary' },
  TEMPORARY: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Temporary' },
  SUBSTITUTE: { color: 'text-purple-600', bg: 'bg-purple-50', label: 'Substitute' },
  TRAINING: { color: 'text-teal-600', bg: 'bg-teal-50', label: 'Training' },
};

export default function FleetAvailabilityPage() {
  const [data, setData] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAvailability(); }, []);

  const fetchAvailability = async () => {
    try {
      const res = await fetch('/api/fleet/availability');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!data) return (
    <div className="text-center py-12 text-gray-500">Failed to load fleet data</div>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Availability</h1>
          <p className="text-gray-600 mt-1">Real-time overview of vehicles, drivers, and assignments</p>
        </div>
        <button onClick={fetchAvailability} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Vehicles</span>
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.vehicles.total}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Available Vehicles</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.vehicles.available}</p>
          <p className="text-xs text-gray-500 mt-1">{data.vehicles.assigned} assigned</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Drivers</span>
            <User className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.drivers.total}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Available Drivers</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.drivers.available}</p>
          <p className="text-xs text-gray-500 mt-1">{data.drivers.assigned} assigned</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Status Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="w-4 h-4 text-green-600" />Active</span>
              <span className="font-medium text-gray-900">{data.vehicles.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-600"><Wrench className="w-4 h-4 text-amber-600" />In Maintenance</span>
              <span className="font-medium text-gray-900">{data.vehicles.inMaintenance}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-600"><AlertTriangle className="w-4 h-4 text-blue-600" />Reserved</span>
              <span className="font-medium text-gray-900">{data.vehicles.reserved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-600"><Ban className="w-4 h-4 text-gray-600" />Out of Service</span>
              <span className="font-medium text-gray-900">{data.vehicles.outOfService}</span>
            </div>
            {data.vehicles.expiredInspections > 0 && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-red-600"><AlertTriangle className="w-4 h-4" />Expired Inspections</span>
                <span className="font-medium text-red-600">{data.vehicles.expiredInspections}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Status Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="w-4 h-4 text-green-600" />Active</span>
              <span className="font-medium text-gray-900">{data.drivers.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-600"><ArrowRightLeft className="w-4 h-4 text-amber-600" />On Leave</span>
              <span className="font-medium text-gray-900">{data.drivers.onLeave}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-600"><AlertTriangle className="w-4 h-4 text-red-600" />Suspended</span>
              <span className="font-medium text-gray-900">{data.drivers.suspended}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-600"><Ban className="w-4 h-4 text-gray-600" />Terminated</span>
              <span className="font-medium text-gray-900">{data.drivers.terminated}</span>
            </div>
            {data.drivers.expiredLicenses > 0 && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-red-600"><AlertTriangle className="w-4 h-4" />Expired Licenses</span>
                <span className="font-medium text-red-600">{data.drivers.expiredLicenses}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Active Assignments ({data.assignments.total})</h3>
          <Link href="/dashboard/assignments" className="text-sm text-blue-600 hover:text-blue-700">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.assignments.list.slice(0, 20).map((a) => {
                const tcfg = typeConfig[a.assignmentType] || typeConfig.PRIMARY;
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{a.vehicle.registrationNumber}</p>
                          <p className="text-sm text-gray-500">{a.vehicle.make} {a.vehicle.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{a.driver.firstName} {a.driver.lastName}</p>
                          <p className="text-sm text-gray-500">{a.driver.employeeId || a.driver.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tcfg.bg} ${tcfg.color}`}>
                        {tcfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.branch ? (
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />{a.branch.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(a.assignedAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {data.assignments.list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No active assignments
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
