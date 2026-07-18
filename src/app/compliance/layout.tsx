"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, FileText, ClipboardCheck, AlertTriangle, CheckCircle, Settings, BarChart3, Home } from "lucide-react";

const navItems = [
  { href: "/compliance", label: "Dashboard", icon: Home },
  { href: "/compliance/vehicle-documents", label: "Vehicle Docs", icon: FileText },
  { href: "/compliance/driver-documents", label: "Driver Docs", icon: FileText },
  { href: "/compliance/inspections", label: "Inspections", icon: ClipboardCheck },
  { href: "/compliance/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/compliance/corrective-actions", label: "Actions", icon: CheckCircle },
  { href: "/compliance/rules", label: "Rules", icon: Settings },
  { href: "/compliance/approvals", label: "Approvals", icon: Shield },
  { href: "/compliance/analytics", label: "Analytics", icon: BarChart3 },
];

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className={`bg-white border-r border-gray-200 transition-all ${collapsed ? "w-16" : "w-64"} hidden md:flex flex-col`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!collapsed && <h2 className="font-bold text-lg text-gray-800">Compliance</h2>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-100 rounded">
            {collapsed ? "→" : "←"}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (pathname?.startsWith(item.href + "/") ?? false);
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
