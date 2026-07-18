const fs = require('fs');
const path = require('path');

const APP_BASE = '/root/.openclaw/workspace/fleet-management-saas/src/app/inventory';

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

// Layout
writeFile(APP_BASE + '/layout.tsx', `"use client";

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
      <aside className={\`bg-white border-r border-gray-200 transition-all \${collapsed ? "w-16" : "w-64"} hidden md:flex flex-col\`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!collapsed && <h2 className="font-bold text-lg text-gray-800">Inventory</h2>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-100 rounded">
            {collapsed ? "→" : "←"}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors \${active ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"}\`}>
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
`);

// Dashboard
writeFile(APP_BASE + '/page.tsx', `"use client";

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
                <div className={\`w-10 h-10 \${card.color} rounded-lg flex items-center justify-center mb-3\`}>
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
`);

// Generic list page
function listPage(title, apiPath, dataKey, headers, cells, newLink) {
  const newBtn = newLink ? `<Link href="${newLink}" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"><Plus className="w-4 h-4" /> Add New</Link>` : '';
  return `"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(\`/api/inventory/${apiPath}?q=\${encodeURIComponent(search)}&page=\${page}&limit=20\`)
      .then(r => r.json())
      .then(d => { if (d.success) { setItems(d.data.${dataKey}); setTotal(d.data.total); } })
      .finally(() => setLoading(false));
  }, [search, page]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">${title}</h1>
        ${newBtn}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No ${title.toLowerCase()} found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>${headers.map(h => `<th className="px-4 py-3 text-left font-medium">${h}</th>`).join('')}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    ${cells.map(c => `<td className="px-4 py-3 text-gray-700">{${c}}</td>`).join('\n                    ')}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 20 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
`;
}

writeFile(APP_BASE + '/parts/page.tsx', listPage('Parts', 'parts', 'parts', ['Part Number', 'Name', 'Category', 'Status'], ['item.partNumber', 'item.name', 'item.category?.name || "—"', 'item.status'], '/inventory/parts/new'));
writeFile(APP_BASE + '/categories/page.tsx', listPage('Categories', 'categories', 'categories', ['Name', 'Description', 'Sort Order'], ['item.name', 'item.description || "—"', 'item.sortOrder'], null));
writeFile(APP_BASE + '/warehouses/page.tsx', listPage('Warehouses', 'warehouses', 'warehouses', ['Code', 'Name', 'City', 'Active'], ['item.code', 'item.name', 'item.city || "—"', 'item.isActive ? "Yes" : "No"'], '/inventory/warehouses/new'));
writeFile(APP_BASE + '/stock/page.tsx', listPage('Stock', 'stock', 'stocks', ['Part', 'Warehouse', 'Quantity', 'Available'], ['item.part?.name || "—"', 'item.warehouse?.name || "—"', 'item.quantity', 'item.availableQuantity'], null));
writeFile(APP_BASE + '/movements/page.tsx', listPage('Movements', 'movements', 'movements', ['Type', 'Part', 'Quantity', 'Date'], ['item.movementType', 'item.stock?.part?.name || "—"', 'item.quantity', 'new Date(item.createdAt).toLocaleDateString()'], null));
writeFile(APP_BASE + '/suppliers/page.tsx', listPage('Suppliers', 'suppliers', 'suppliers', ['Name', 'Contact', 'Phone', 'Active'], ['item.name', 'item.contactName || "—"', 'item.phone || "—"', 'item.isActive ? "Yes" : "No"'], null));
writeFile(APP_BASE + '/purchase-orders/page.tsx', listPage('Purchase Orders', 'purchase-orders', 'orders', ['Order #', 'Supplier', 'Status', 'Total'], ['item.orderNumber', 'item.supplier?.name || "—"', 'item.status', 'item.totalAmount || 0'], '/inventory/purchase-orders/new'));
writeFile(APP_BASE + '/transfers/page.tsx', listPage('Transfers', 'transfers', 'transfers', ['Transfer #', 'From', 'To', 'Status'], ['item.transferNumber', 'item.sourceWarehouse?.name || "—"', 'item.destinationWarehouse?.name || "—"', 'item.status'], null));
writeFile(APP_BASE + '/tools/page.tsx', listPage('Tools', 'tools', 'tools', ['Tool #', 'Name', 'Status', 'Condition'], ['item.toolNumber', 'item.name', 'item.status', 'item.condition'], null));
writeFile(APP_BASE + '/alerts/page.tsx', listPage('Alerts', 'alerts', 'alerts', ['Type', 'Title', 'Read', 'Resolved'], ['item.alertType', 'item.title', 'item.isRead ? "Yes" : "No"', 'item.isResolved ? "Yes" : "No"'], null));

// Analytics page
writeFile(APP_BASE + '/analytics/page.tsx', `"use client";

import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/inventory/analytics").then(r => r.json()),
      fetch("/api/inventory/analytics/stock-value").then(r => r.json()),
      fetch("/api/inventory/analytics/top-moving").then(r => r.json()),
    ]).then(([overview, stockValue, topMoving]) => {
      setData({ overview: overview.data, stockValue: stockValue.data, topMoving: topMoving.data });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center">Failed to load analytics.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inventory Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(data.overview || {}).map(([key, value]) => (
          <div key={key} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
            <p className="text-2xl font-bold text-gray-900">{String(value)}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Stock Value by Warehouse</h3>
          <div className="space-y-2">
            {(data.stockValue || []).map((w: any) => (
              <div key={w.name} className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">{w.name}</span>
                <span className="text-sm font-medium text-gray-900">KES {w.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Top Moving Parts</h3>
          <div className="space-y-2">
            {(data.topMoving || []).map((p: any) => (
              <div key={p.stockId} className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">{p.partName}</span>
                <span className="text-sm font-medium text-gray-900">{p.totalQuantity} units</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
`);

// New form pages
writeFile(APP_BASE + '/parts/new/page.tsx', `"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPartPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const res = await fetch("/api/inventory/parts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) router.push("/inventory/parts");
    else { alert("Failed to create part"); setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Part</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label><input name="partNumber" required className="w-full px-3 py-2 border rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input name="name" required className="w-full px-3 py-2 border rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label><input name="unitPrice" type="number" defaultValue="0" className="w-full px-3 py-2 border rounded-lg" /></div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
`);

writeFile(APP_BASE + '/warehouses/new/page.tsx', `"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewWarehousePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const res = await fetch("/api/inventory/warehouses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) router.push("/inventory/warehouses");
    else { alert("Failed to create warehouse"); setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Warehouse</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Code</label><input name="code" required className="w-full px-3 py-2 border rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input name="name" required className="w-full px-3 py-2 border rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input name="city" className="w-full px-3 py-2 border rounded-lg" /></div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
`);

writeFile(APP_BASE + '/purchase-orders/new/page.tsx', `"use client";

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
`);

console.log("Frontend pages created successfully");
