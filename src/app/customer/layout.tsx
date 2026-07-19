"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { LayoutDashboard, Package, MapPin, History, FileText, HelpCircle, User, LogOut } from "lucide-react";

const nav = [
  { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customer/shipments", label: "Shipments", icon: Package },
  { href: "/customer/history", label: "History", icon: History },
  { href: "/customer/invoices", label: "Invoices", icon: FileText },
  { href: "/customer/support", label: "Support", icon: HelpCircle },
  { href: "/customer/profile", label: "Profile", icon: User },
];

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50
      <aside className="w-64 border-r border-gray-200 bg-white
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-900 Portal</h2>
          <nav className="mt-4 space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button className="mt-6 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
