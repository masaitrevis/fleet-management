'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Users,
  MapPin,
  Briefcase,
  Shield,
  Truck,
  Mail,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Route,
  Navigation,
  Radio,
  Map,
  Bell,
  Activity,
  Play,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard/company', label: 'Company', icon: Building2 },
  { href: '/dashboard/branches', label: 'Branches', icon: MapPin },
  { href: '/dashboard/departments', label: 'Departments', icon: Briefcase },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/vehicles', label: 'Vehicles', icon: Truck },
  { href: '/dashboard/drivers', label: 'Drivers', icon: Users },
  { href: '/dashboard/assignments', label: 'Assignments', icon: Truck },
  { href: '/dashboard/routes', label: 'Routes', icon: Route },
  { href: '/dashboard/trips', label: 'Trips', icon: Navigation },
  { href: '/dashboard/shifts', label: 'Shifts', icon: Briefcase },
  { href: '/dashboard/gps/devices', label: 'GPS Devices', icon: Radio },
  { href: '/dashboard/live', label: 'Live Map', icon: Map },
  { href: '/dashboard/geofences', label: 'Geofences', icon: MapPin },
  { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
  { href: '/dashboard/telemetry', label: 'Telemetry', icon: Activity },
  { href: '/dashboard/invitations', label: 'Invitations', icon: Mail },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            FleetOS
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = (pathname || "").startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16">
          <div className="flex items-center h-full px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-4"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 ml-auto">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">Admin User</span>
                <span className="mx-2">·</span>
                <span>Company Owner</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                AU
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
