"use client";
import { useEffect, useState } from "react";
import { CreditCard, Calendar, Pause, Play, XCircle, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/subscriptions").then((r) => r.json()),
      fetch("/api/subscriptions/plans").then((r) => r.json()),
    ])
      .then(([subRes, plansRes]) => {
        if (subRes.success) setSubscription(subRes.data);
        if (plansRes.success) setPlans(plansRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (action: string, body?: any) => {
    const res = await fetch(`/api/subscriptions/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    const json = await res.json();
    if (json.success) {
      setSubscription(json.data);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading subscription...</div>;

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    TRIAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PAUSED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    EXPIRED: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Subscription Management</h1>

      {subscription ? (
        <div className="space-y-6">
          {/* Current Plan Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{subscription.plan?.name || "Plan"}</h2>
                <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[subscription.status] || statusColors.ACTIVE}`}>
                  {subscription.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {subscription.currency} {subscription.amount?.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{subscription.billingInterval?.toLowerCase()}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">Vehicles</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{subscription.vehicleLimit}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">Users</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{subscription.userLimit}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">Next Billing</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">Auto-Renew</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{subscription.autoRenew ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <button onClick={() => handleAction("pause")} className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              <Pause className="h-4 w-4" /> Pause
            </button>
            <button onClick={() => handleAction("resume")} className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              <Play className="h-4 w-4" /> Resume
            </button>
            <button onClick={() => handleAction("cancel")} className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900/30 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20">
              <XCircle className="h-4 w-4" /> Cancel
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
              <ArrowUpCircle className="h-4 w-4" /> Upgrade
            </button>
          </div>

          {/* Plan Comparison */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Available Plans</h3>
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{plan.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{plan.vehicleLimit} vehicles · {plan.userLimit} users</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{plan.currency} {plan.price.toLocaleString()}</p>
                    <button
                      onClick={() => handleAction("upgrade", { planId: plan.id })}
                      disabled={subscription.planId === plan.id}
                      className="mt-1 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {subscription.planId === plan.id ? "Current" : "Switch"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No Active Subscription</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Start a free trial or choose a plan to get started.</p>
          <div className="mt-4 flex justify-center gap-3">
            <button onClick={() => handleAction("trial", { planId: plans[0]?.id })} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Start Free Trial
            </button>
            <a href="/pricing" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
              View Plans
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
