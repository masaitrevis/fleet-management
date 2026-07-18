"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const res = await fetch("/api/inventory/purchase-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) router.push("/inventory/purchase-orders");
    else { alert("Failed to create order"); setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Purchase Order</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label><input name="orderNumber" required className="w-full px-3 py-2 border rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea name="notes" rows={3} className="w-full px-3 py-2 border rounded-lg" /></div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
