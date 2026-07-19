"use client";
import { useEffect, useState } from "react";
import { PricingCard } from "@/components/billing/PricingCard";
import { CheckCircle } from "lucide-react";

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscriptions/plans")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setPlans(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading plans...</div>;

  const defaultFeatures = [
    { text: "Vehicle Management", included: true },
    { text: "Driver Management", included: true },
    { text: "Trip Tracking", included: true },
    { text: "GPS Tracking", included: true },
    { text: "Fuel Management", included: false },
    { text: "Maintenance & Workshop", included: false },
    { text: "Inventory & Parts", included: false },
    { text: "Advanced Analytics", included: false },
    { text: "API Access", included: false },
    { text: "White Labeling", included: false },
  ];

  const planFeatures: Record<string, typeof defaultFeatures> = {
    Starter: defaultFeatures.map((f) => ({ ...f, included: f.text === "Fuel Management" ? true : f.included })),
    Professional: defaultFeatures.map((f) =>
      f.text === "Maintenance & Workshop" || f.text === "Inventory & Parts" || f.text === "Advanced Analytics"
        ? { ...f, included: true }
        : f
    ),
    Enterprise: defaultFeatures.map((f) => ({ ...f, included: true })),
    Free: defaultFeatures.map((f) => f.text === "Vehicle Management" || f.text === "Driver Management"
      ? { ...f, included: true }
      : { ...f, included: false }
    ),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 Transparent Pricing</h1>
        <p className="mt-2 text-gray-600 the plan that fits your fleet. No hidden fees.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            name={plan.name}
            price={plan.price}
            currency={plan.currency}
            interval={plan.billingInterval.toLowerCase()}
            description={plan.description}
            features={planFeatures[plan.name] || defaultFeatures}
            isPopular={plan.name === "Professional"}
            onSelect={() => (window.location.href = "/billing/subscription")}
          />
        ))}
        {plans.length === 0 && (
          <>
            <PricingCard name="Starter" price={2990} currency="KES" interval="month" features={defaultFeatures} />
            <PricingCard name="Professional" price={7990} currency="KES" interval="month" features={planFeatures.Professional} isPopular />
            <PricingCard name="Enterprise" price={19990} currency="KES" interval="month" features={planFeatures.Enterprise} />
          </>
        )}
      </div>
      <div className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100
          <CheckCircle className="h-6 w-6 text-blue-600 />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 a custom plan?</h3>
        <p className="mt-1 text-sm text-gray-600 us for enterprise pricing tailored to your fleet size.</p>
        <button className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800
          Contact Sales
        </button>
      </div>
    </div>
  );
}
