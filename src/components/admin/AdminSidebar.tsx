import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  ToggleRight,
  Settings,
  ShieldAlert,
  ClipboardList,
  ListOrdered,
  Activity,
  Database,
  BarChart3,
  LogOut,
} from 'lucide-react';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/tenants', label: 'Tenants', icon: Building2 },
  { href: '/admin/users', label: 'Platform Users', icon: Users },
  { href: '/admin/feature-flags', label: 'Feature Flags', icon: ToggleRight },
  { href: '/admin/system-config', label: 'System Config', icon: Settings },
  { href: '/admin/security', label: 'Security', icon: ShieldAlert },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList },
  { href: '/admin/jobs', label: 'Queue Manager', icon: ListOrdered },
  { href: '/admin/monitoring', label: 'Monitoring', icon: Activity },
  { href: '/admin/backups', label: 'Backups', icon: Database },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

export default function AdminSidebar() {
  const pathname = usePathname() ?? '';

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col min-h-screen">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Platform Admin</h2>
        <p className="text-xs text-gray-500 mt-0.5">Super Admin Panel</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-200">
        <button className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
