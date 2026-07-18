"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, BarChart3 } from "lucide-react";

const nav = [
  { href: "/analytics", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics/reports", label: "Reports", icon: FileText },
  { href: "/analytics/fleet", label: "Fleet", icon: BarChart3 },
  { href: "/analytics/drivers", label: "Drivers", icon: BarChart3 },
  { href: "/analytics/fuel", label: "Fuel", icon: BarChart3 },
  { href: "/analytics/maintenance", label: "Maintenance", icon: BarChart3 },
  { href: "/analytics/compliance", label: "Compliance", icon: BarChart3 },
  { href: "/analytics/financial", label: "Financial", icon: BarChart3 },
];

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Analytics</h2>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-50">
        {children}
      </main>
    </div>
  );
}
