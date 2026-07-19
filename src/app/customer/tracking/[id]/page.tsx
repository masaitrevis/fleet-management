"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MapPin, Truck, Clock, Phone } from "lucide-react";

export default function CustomerTrackingPage() {
  const params = useParams();
  const id = params?.id as string;
  const [tracking, setTracking] = useState<any>(null);
  const [liveLocation, setLiveLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/customer/tracking/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setTracking(json.data);
          setLiveLocation(json.data.latestLocation);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !tracking) return;
    const interval = setInterval(() => {
      fetch(`/api/customer/tracking/${id}/live`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setLiveLocation(json.data);
        });
    }, 30000);
    return () => clearInterval(interval);
  }, [id, tracking]);

  if (loading) return <div className="text-center">Loading tracking...</div>;
  if (!tracking) return <div className="text-center">Shipment not found</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Track Shipment</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{tracking.tripNumber || tracking.title}</p>
            <p className="text-sm text-gray-500">Status: <span className="font-medium text-blue-600">{tracking.status}</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">ETA</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {tracking.estimatedEndTime ? new Date(tracking.estimatedEndTime).toLocaleString() : "N/A"}
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Driver</h3>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <Truck className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{tracking.driver?.firstName} {tracking.driver?.lastName}</p>
              <p className="flex items-center gap-1 text-sm text-gray-500"><Phone className="h-3 w-3" /> {tracking.driver?.phone}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Vehicle</h3>
          <p className="text-gray-700 dark:text-gray-300">{tracking.vehicle?.registrationNumber}</p>
          <p className="text-sm text-gray-500">{tracking.vehicle?.make} {tracking.vehicle?.model} · {tracking.vehicle?.color}</p>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Live Location</h3>
        {liveLocation ? (
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-500" /> {liveLocation.latitude}, {liveLocation.longitude}</p>
            <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-400" /> Updated: {new Date(liveLocation.timestamp).toLocaleTimeString()}</p>
            {liveLocation.speed !== null && <p>Speed: {liveLocation.speed} km/h</p>}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No live location data available</p>
        )}
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Stops</h3>
        <div className="space-y-2">
          {tracking.tripStops?.map((stop: any, i: number) => (
            <div key={stop.id} className="flex items-center gap-3">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                stop.actualArrival ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{stop.name}</p>
                <p className="text-xs text-gray-500">{stop.address}</p>
              </div>
              {stop.actualArrival && <span className="ml-auto text-xs text-green-600">Arrived</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
