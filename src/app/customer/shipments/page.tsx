"use client";
import { useEffect, useState } from "react";
import { MapPin, Truck, Clock } from "lucide-react";
import Link from "next/link";

export default function CustomerShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customer/shipments")
      .then((r) => r.json())
      .then((json) => { if (json.success) setShipments(json.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center">Loading shipments...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Active Shipments</h1>
      {shipments.length === 0 && <p className="text-gray-500">No active shipments</p>}
      {shipments.map((s: any) => (
        <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{s.tripNumber || s.title || "Shipment"}</p>
              <div className="mt-2 space-y-1 text-sm text-gray-500">
                <p className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> {s.vehicle?.registrationNumber} · {s.vehicle?.make} {s.vehicle?.model}</p>
                <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Driver: {s.driver?.firstName} {s.driver?.lastName}</p>
                <p className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> ETA: {s.estimatedEndTime ? new Date(s.estimatedEndTime).toLocaleString() : "N/A"}</p>
              </div>
            </div>
            <Link href={`/customer/tracking/${s.id}`} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              Track
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
