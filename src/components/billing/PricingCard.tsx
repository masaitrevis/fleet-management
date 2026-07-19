"use client";
import { Check, X } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: number;
  currency: string;
  interval: string;
  description?: string;
  features: { text: string; included: boolean }[];
  isPopular?: boolean;
  isCurrent?: boolean;
  onSelect?: () => void;
  buttonText?: string;
}

export function PricingCard({
  name,
  price,
  currency,
  interval,
  description,
  features,
  isPopular,
  isCurrent,
  onSelect,
  buttonText = "Choose Plan",
}: PricingCardProps) {
  return (
    <div
      className={`relative rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md ${
        isPopular
          ? "border-blue-500 bg-blue-50/50
          : "border-gray-200 bg-white
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
          Most Popular
        </div>
      )}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900
        {description && <p className="mt-1 text-sm text-gray-500
      </div>
      <div className="mb-6">
        <span className="text-3xl font-bold text-gray-900
          {currency} {price.toLocaleString()}
        </span>
        <span className="text-sm text-gray-500
      </div>
      <ul className="mb-6 space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            {feature.included ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <X className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            )}
            <span className={`text-sm ${feature.included ? "text-gray-700 : "text-gray-400
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        disabled={isCurrent}
        className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
          isCurrent
            ? "cursor-not-allowed bg-gray-100 text-gray-500
            : isPopular
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-900 text-white hover:bg-gray-800
        }`}
      >
        {isCurrent ? "Current Plan" : buttonText}
      </button>
    </div>
  );
}
