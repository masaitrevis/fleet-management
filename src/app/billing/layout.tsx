import Link from "next/link";
import { ReactNode } from "react";
import { CreditCard, FileText, BarChart3, Settings } from "lucide-react";

const nav = [
  { href: "/billing/subscription", label: "Subscription", icon: CreditCard },
  { href: "/billing/invoices", label: "Invoices", icon: FileText },
  { href: "/billing/usage", label: "Usage", icon: BarChart3 },
  { href: "/billing/payment-methods", label: "Payment Methods", icon: Settings },
];

export default function BillingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50
      <aside className="w-64 border-r border-gray-200 bg-white
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900
          <nav className="mt-4 space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
