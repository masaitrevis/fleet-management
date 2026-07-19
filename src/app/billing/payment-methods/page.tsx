"use client";
import { useState } from "react";
import { CreditCard, Plus, Trash2 } from "lucide-react";

interface PaymentMethodItem {
  id: string;
  type: string;
  last4: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethodItem[]>([
    { id: "1", type: "card", last4: "4242", brand: "Visa", expiryMonth: "12", expiryYear: "2026", isDefault: true },
    { id: "2", type: "mobile_money", last4: "9012", brand: "M-Pesa", expiryMonth: "", expiryYear: "", isDefault: false },
  ]);

  const removeMethod = (id: string) => {
    setMethods(methods.filter((m) => m.id !== id));
  };

  const setDefault = (id: string) => {
    setMethods(methods.map((m) => ({ ...m, isDefault: m.id === id })));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 Methods</h1>

      <div className="space-y-4">
        {methods.map((method) => (
          <div
            key={method.id}
            className={`flex items-center justify-between rounded-xl border p-4 ${
              method.isDefault
                ? "border-blue-200 bg-blue-50/50
                : "border-gray-200 bg-white
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100
                <CreditCard className="h-5 w-5 text-gray-600 />
              </div>
              <div>
                <p className="font-medium text-gray-900
                  {method.brand} ···· {method.last4}
                </p>
                {method.type === "card" && (
                  <p className="text-sm text-gray-500 {method.expiryMonth}/{method.expiryYear}</p>
                )}
                {method.isDefault && (
                  <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700
                    Default
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!method.isDefault && (
                <button
                  onClick={() => setDefault(method.id)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50
                >
                  Set Default
                </button>
              )}
              <button
                onClick={() => removeMethod(method.id)}
                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        <button className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-4 text-sm font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50
          <Plus className="h-4 w-4" /> Add Payment Method
        </button>
      </div>
    </div>
  );
}
