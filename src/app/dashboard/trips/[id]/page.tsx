'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Calendar, Clock, MapPin, Truck, User, Route, Flag,
  CheckCircle, AlertTriangle, Package, ClipboardCheck, FileSearch,
  Play, Pause, CheckSquare, XCircle, Loader2
} from 'lucide-react';

interface TripDetail {
  id: string;
  tripNumber: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  startTime?: string;
  actualStartTime?: string;
  estimatedEndTime?: string;
  actualEndTime?: string;
  startOdometer?: number;
  endOdometer?: number;
  distance?: number;
  estimatedDistance?: number;
  fuelCost?: number;
  totalCost?: number;
  notes?: string;
  cancellationReason?: string;
  vehicle: { id: string; registrationNumber: string; make: string; model: string; color?: string };
  driver: { id: string; firstName: string; lastName: string; phone?: string; photo?: string };
  route?: { id: string; name: string; startLocation: string; endLocation: string };
  customer?: { id: string; name: string; email?: string; phone?: string };
  tripStops: any[];
  tripCargos: any[];
  tripTimelines: any[];
  tripChecklists: any[];
  tripInspections: any[];
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  PLANNED: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Planned' },
  SCHEDULED: { icon: Calendar, color: 'text-cyan-600', bg: 'bg-cyan-50', label: 'Scheduled' },
  ASSIGNED: { icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Assigned' },
  IN_PROGRESS: { icon: Play, color: 'text-green-600', bg: 'bg-green-50', label: 'In Progress' },
  COMPLETED: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Completed' },
  CANCELLED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Cancelled' },
  DELAYED: { icon: Pause, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Delayed' },
  NO_SHOW: { icon: AlertTriangle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'No Show' },
};

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params?.id as string;
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [checklist, setChecklist] = useState(trip?.tripChecklists || []);
  const [timeline, setTimeline] = useState(trip?.tripTimelines || []);
  const [inspections, setInspections] = useState(trip?.tripInspections || []);

  useEffect(() => { fetchTrip(); }, [tripId]);

  const fetchTrip = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}`);
      const data = await res.json();
      if (data.success) {
        setTrip(data.data);
        setChecklist(data.data.tripChecklists || []);
        setTimeline(data.data.tripTimelines || []);
        setInspections(data.data.tripInspections || []);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const fetchTimeline = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/timeline`);
      const data = await res.json();
      if (data.success) setTimeline(data.data);
    } catch (error) { console.error(error); }
  };

  const fetchChecklist = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/checklist`);
      const data = await res.json();
      if (data.success) setChecklist(data.data);
    } catch (error) { console.error(error); }
  };

  const fetchInspections = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/inspection`);
      const data = await res.json();
      if (data.success) setInspections(data.data);
    } catch (error) { console.error(error); }
  };

  const handleChecklistToggle = async (checklistId: string, isCompleted: boolean) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: checklistId, isCompleted: !isCompleted }),
      });
      if (res.ok) fetchChecklist();
    } catch (error) { console.error(error); }
  };

  const handleStart = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (res.ok) { fetchTrip(); fetchTimeline(); }
    } catch (error) { console.error(error); }
  };

  const handleComplete = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (res.ok) { fetchTrip(); fetchTimeline(); }
    } catch (error) { console.error(error); }
  };

  const handleCancel = async () => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;
    try {
      const res = await fetch(`/api/trips/${tripId}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cancellationReason: reason }) });
      if (res.ok) { fetchTrip(); fetchTimeline(); }
    } catch (error) { console.error(error); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!trip) return (
    <div className="text-center py-12">
      <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">Trip not found</p>
      <Link href="/dashboard/trips" className="text-blue-600 hover:underline mt-2 inline-block">Back to trips</Link>
    </div>
  );

  const statusCfg = statusConfig[trip.status] || statusConfig.PLANNED;
  const StatusIcon = statusCfg.icon;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/trips" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{trip.title}</h1>
          <p className="text-gray-500">{trip.tripNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${statusCfg.bg} ${statusCfg.color}`}>
            <StatusIcon className="w-4 h-4" />{statusCfg.label}
          </span>
          {trip.status === 'ASSIGNED' && (
            <button onClick={handleStart} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <Play className="w-4 h-4" />Start Trip
            </button>
          )}
          {trip.status === 'IN_PROGRESS' && (
            <>
              <button onClick={handleComplete} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />Complete
              </button>
              <button onClick={handleCancel} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                <XCircle className="w-4 h-4" />Cancel
              </button>
            </>
          )}
          <Link href={`/dashboard/trips/${tripId}/edit`} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Edit</Link>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {['overview', 'stops', 'cargo', 'checklist', 'timeline', 'inspections'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-900">{trip.description || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className="text-gray-900">{trip.priority || 'NORMAL'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Time</p>
                  <p className="text-gray-900">{trip.startTime ? new Date(trip.startTime).toLocaleString() : '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimated End</p>
                  <p className="text-gray-900">{trip.estimatedEndTime ? new Date(trip.estimatedEndTime).toLocaleString() : '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Actual Start</p>
                  <p className="text-gray-900">{trip.actualStartTime ? new Date(trip.actualStartTime).toLocaleString() : '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Actual End</p>
                  <p className="text-gray-900">{trip.actualEndTime ? new Date(trip.actualEndTime).toLocaleString() : '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Distance</p>
                  <p className="text-gray-900">{trip.distance ? `${trip.distance} km` : trip.estimatedDistance ? `${trip.estimatedDistance} km (est)` : '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Odometer</p>
                  <p className="text-gray-900">{trip.startOdometer ? `${trip.startOdometer} - ${trip.endOdometer || '...'}` : '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fuel Cost</p>
                  <p className="text-gray-900">{trip.fuelCost ? `KES ${trip.fuelCost.toLocaleString()}` : '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Cost</p>
                  <p className="text-gray-900">{trip.totalCost ? `KES ${trip.totalCost.toLocaleString()}` : '—'}</p>
                </div>
              </div>
              {trip.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{trip.notes}</p>
                </div>
              )}
              {trip.cancellationReason && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Cancellation Reason</p>
                  <p className="text-red-700">{trip.cancellationReason}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />Vehicle
              </h2>
              <p className="font-medium text-gray-900">{trip.vehicle.registrationNumber}</p>
              <p className="text-gray-600">{trip.vehicle.make} {trip.vehicle.model}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />Driver
              </h2>
              <p className="font-medium text-gray-900">{trip.driver.firstName} {trip.driver.lastName}</p>
              {trip.driver.phone && <p className="text-gray-600">{trip.driver.phone}</p>}
            </div>

            {trip.route && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Route className="w-5 h-5" />Route
                </h2>
                <p className="font-medium text-gray-900">{trip.route.name}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                  <MapPin className="w-4 h-4" />{trip.route.startLocation}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Flag className="w-4 h-4" />{trip.route.endLocation}
                </div>
              </div>
            )}

            {trip.customer && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
                <p className="font-medium text-gray-900">{trip.customer.name}</p>
                {trip.customer.email && <p className="text-gray-600">{trip.customer.email}</p>}
                {trip.customer.phone && <p className="text-gray-600">{trip.customer.phone}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'stops' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Stops ({trip.tripStops.length})</h2>
          {trip.tripStops.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No stops scheduled</p>
          ) : (
            <div className="space-y-4">
              {trip.tripStops.map((stop, i) => (
                <div key={stop.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{stop.name}</p>
                    <p className="text-sm text-gray-600">{stop.address}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      {stop.scheduledArrival && (
                        <span className="text-gray-500">Scheduled: {new Date(stop.scheduledArrival).toLocaleString()}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        stop.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        stop.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {stop.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'cargo' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />Cargo ({trip.tripCargos.length})
          </h2>
          {trip.tripCargos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No cargo items</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trip.tripCargos.map((cargo) => (
                <div key={cargo.id} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{cargo.cargoType}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    {cargo.weight && <p className="text-gray-600">Weight: {cargo.weight} kg</p>}
                    {cargo.volume && <p className="text-gray-600">Volume: {cargo.volume} m³</p>}
                    {cargo.quantity && <p className="text-gray-600">Qty: {cargo.quantity}</p>}
                    {cargo.customerReference && <p className="text-gray-600">Ref: {cargo.customerReference}</p>}
                  </div>
                  {cargo.isDangerousGoods && <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Dangerous Goods</span>}
                  {cargo.notes && <p className="text-sm text-gray-500 mt-2">{cargo.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'checklist' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />Checklist
          </h2>
          {checklist.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No checklist items</p>
          ) : (
            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <button
                    onClick={() => handleChecklistToggle(item.id, item.isCompleted)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      item.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}
                  >
                    {item.isCompleted && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm ${item.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {item.item}
                    </p>
                    {item.isRequired && <span className="text-xs text-amber-600">Required</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
          {timeline.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No timeline events</p>
          ) : (
            <div className="space-y-4">
              {timeline.map((event) => (
                <div key={event.id} className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{event.eventType}</p>
                      <p className="text-sm text-gray-500">{new Date(event.eventTime).toLocaleString()}</p>
                    </div>
                    {event.notes && <p className="text-sm text-gray-600 mt-1">{event.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'inspections' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileSearch className="w-5 h-5" />Inspections
          </h2>
          {inspections.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No inspections recorded</p>
          ) : (
            <div className="space-y-4">
              {inspections.map((insp) => (
                <div key={insp.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      insp.type === 'PRE_TRIP' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {insp.type}
                    </span>
                    <span className="text-sm text-gray-500">{new Date(insp.inspectedAt).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    {insp.odometer && <p className="text-gray-600">Odometer: {insp.odometer} km</p>}
                    {insp.fuelLevel && <p className="text-gray-600">Fuel: {insp.fuelLevel}%</p>}
                  </div>
                  {insp.damageReport && <p className="text-sm text-red-600 mt-2">Damage: {insp.damageReport}</p>}
                  {insp.comments && <p className="text-sm text-gray-600 mt-2">{insp.comments}</p>}
                  {insp.photos?.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {insp.photos.map((photo: string, i: number) => (
                        <img key={i} src={photo} alt="Inspection" className="w-20 h-20 object-cover rounded-lg" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
