'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Car, UserCircle, Route, PlayCircle, PauseCircle } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import KpiCard from '@/components/admin/KpiCard';

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  email: string;
  status: string;
  createdAt: string;
  _count?: { companyUsers: number; vehicles: number; drivers: number; trips: number };
  subscriptions?: Array<{ plan: { name: string }; status: string }>;
}

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/admin/tenants/${id}`).then((r) => r.json()),
      fetch(`/api/admin/tenants/${id}/usage`).then((r) => r.json()),
    ]).then(([tenantRes, usageRes]) => {
      if (tenantRes.success) setTenant(tenantRes.data);
      if (usageRes.success) setUsage(usageRes.data);
      setLoading(false);
    });
  }, [id]);

  const handleImpersonate = () => {
    fetch(`/api/admin/tenants/${id}/impersonate`, { method: 'POST' })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          alert(`Impersonation token generated. Expires in ${res.data.expiresIn}`);
        }
      });
  };

  if (loading) {
    return (
      <div>
        <AdminHeader title="Tenant Details" />
        <div className="p-6 animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!tenant) return <div className="p-6 text-red-600">Tenant not found</div>;

  return (
    <div>
      <AdminHeader title={tenant.name} subtitle={`Slug: ${tenant.slug} | Status: ${tenant.status}`} />
      <div className="p-6 space-y-6">
        <button onClick={() => router.push('/admin/tenants')} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4" /> Back to Tenants
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Users" value={usage?.userCount ?? 0} icon={Users} />
          <KpiCard title="Vehicles" value={usage?.vehicleCount ?? 0} icon={Car} />
          <KpiCard title="Drivers" value={usage?.driverCount ?? 0} icon={UserCircle} />
          <KpiCard title="Active Trips" value={usage?.activeTripCount ?? 0} icon={Route} />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Subscription</h3>
          {tenant.subscriptions && tenant.subscriptions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">Plan: {tenant.subscriptions[0].plan.name}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Status: {tenant.subscriptions[0].status}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active subscription</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleImpersonate}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            Impersonate Tenant
          </button>
          {tenant.status !== 'SUSPENDED' ? (
            <button
              onClick={() => fetch(`/api/admin/tenants/${id}/suspend`, { method: 'PUT' }).then(() => window.location.reload())}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 text-sm font-medium rounded-md hover:bg-amber-200"
            >
              <PauseCircle className="h-4 w-4" /> Suspend
            </button>
          ) : (
            <button
              onClick={() => fetch(`/api/admin/tenants/${id}/activate`, { method: 'PUT' }).then(() => window.location.reload())}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-md hover:bg-emerald-200"
            >
              <PlayCircle className="h-4 w-4" /> Activate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
