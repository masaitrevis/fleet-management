"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Warehouse, Boxes, ArrowLeftRight, ShoppingCart, Truck, Wrench, Bell, BarChart3, Tag, Home } from "lucide-react";

const navItems = [
  { href: "/inventory", label: "Dashboard", icon: Home },
  { href: "/inventory/parts", label: "Parts", icon: Package },
  { href: "/inventory/categories", label: "Categories", icon: Tag },
  { href: "/inventory/warehouses", label: "Warehouses", icon: Warehouse },
  { href: "/inventory/stock", label: "Stock", icon: Boxes },
  { href: "/inventory/movements", label: "Movements", icon: ArrowLeftRight },
  { href: "/inventory/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
  { href: "/inventory/suppliers", label: "Suppliers", icon: Truck },
  { href: "/inventory/transfers", label: "Transfers", icon: ArrowLeftRight },
  { href: "/inventory/tools", label: "Tools", icon: Wrench },
  { href: "/inventory/alerts", label: "Alerts", icon: Bell },
  { href: "/inventory/analytics", label: "Analytics", icon: BarChart3 },
];

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className={`bg-white border-r border-gray-200 transition-all ${collapsed ? "w-16" : "w-64"} hidden md:flex flex-col`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!collapsed && <h2 className="font-bold text-lg text-gray-800">Inventory</h2>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-100 rounded">
            {collapsed ? "→" : "←"}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (pathname || "").startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}>
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
