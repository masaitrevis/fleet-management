"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Warehouse, Truck, Wrench, AlertTriangle, ShoppingCart } from "lucide-react";

export default function InventoryDashboard() {
  const [stats, setStats] = useState({ totalParts: 0, totalWarehouses: 0, totalSuppliers: 0, totalTools: 0, lowStockCount: 0, pendingOrders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/inventory/analytics")
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Parts", value: stats.totalParts, icon: Package, href: "/inventory/parts", color: "bg-blue-500" },
    { label: "Warehouses", value: stats.totalWarehouses, icon: Warehouse, href: "/inventory/warehouses", color: "bg-green-500" },
    { label: "Suppliers", value: stats.totalSuppliers, icon: Truck, href: "/inventory/suppliers", color: "bg-purple-500" },
    { label: "Tools", value: stats.totalTools, icon: Wrench, href: "/inventory/tools", color: "bg-orange-500" },
    { label: "Low Stock", value: stats.lowStockCount, icon: AlertTriangle, href: "/inventory/stock", color: "bg-red-500" },
    { label: "Pending Orders", value: stats.pendingOrders, icon: ShoppingCart, href: "/inventory/purchase-orders", color: "bg-yellow-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inventory Dashboard</h1>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} href={card.href} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
