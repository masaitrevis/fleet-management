'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, History, User, Calendar, ArrowRight, Wrench, Fuel, Gauge, FileText, CheckCircle, Ban, AlertTriangle } from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user?: { firstName: string; lastName: string };
  metadata?: Record<string, any>;
}

export default function VehicleHistoryPage() {
  const params = useParams();
  const id = params?.id as string;
  const [vehicle, setVehicle] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [odometerReadings, setOdometerReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const [vRes, hRes] = await Promise.all([
        fetch(`/api/vehicles/${id}`),
        fetch(`/api/vehicles/${id}/history`),
      ]);
      const vData = await vRes.json();
      const hData = await hRes.json();
      if (vData.success) {
        setVehicle(vData.data);
        setOdometerReadings(vData.data.odometerReadings || []);
      }
      if (hData.success) setAssignments(hData.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const timelineEvents: TimelineEvent[] = [
    ...(assignments.map((a) => ({
      id: `assignment-${a.id}`,
      type: a.endedAt ? 'UNASSIGNED' : 'ASSIGNED',
      description: a.endedAt
        ? `Unassigned from ${a.driver.firstName} ${a.driver.lastName}`
        : `Assigned to ${a.driver.firstName} ${a.driver.lastName}`,
      createdAt: a.endedAt || a.assignedAt,
      user: a.assignedBy,
      metadata: { notes: a.notes },
    }))),
    ...(odometerReadings.map((o) => ({
      id: `odometer-${o.id}`,
      type: 'ODOMETER',
      description: `Odometer updated to ${o.reading.toLocaleString()} km (${o.source.toLowerCase()})`,
      createdAt: o.createdAt,
      metadata: { notes: o.notes },
    }))),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const eventConfig: Record<string, { icon: any; color: string; bg: string }> = {
    ASSIGNED: { icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
    UNASSIGNED: { icon: ArrowRight, color: 'text-gray-600', bg: 'bg-gray-100' },
    ODOMETER: { icon: Gauge, color: 'text-green-600', bg: 'bg-green-50' },
    MAINTENANCE: { icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
    FUEL: { icon: Fuel, color: 'text-orange-600', bg: 'bg-orange-50' },
    DOCUMENT: { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/vehicles/${id}`} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Timeline</h1>
          <p className="text-gray-600">{vehicle?.make} {vehicle?.model} · {vehicle?.registrationNumber}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
          <div className="space-y-6">
            {timelineEvents.length > 0 ? timelineEvents.map((event) => {
              const cfg = eventConfig[event.type] || eventConfig.ODOMETER;
              const Icon = cfg.icon;
              return (
                <div key={event.id} className="relative flex items-start gap-4 pl-1">
                  <div className={`relative z-10 w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-gray-900">{event.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(event.createdAt).toLocaleString()}</span>
                      {event.user && <span>by {event.user.firstName} {event.user.lastName}</span>}
                    </div>
                    {event.metadata?.notes && <p className="text-sm text-gray-600 mt-1">{event.metadata.notes}</p>}
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No history events yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
