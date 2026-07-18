const fs = require('fs');
const path = require('path');

const APP = '/root/.openclaw/workspace/fleet-management-saas/src/app/notifications';

function mkdir(p) { fs.mkdirSync(p, { recursive: true }); }
function write(f, c) { mkdir(path.dirname(f)); fs.writeFileSync(f, c); }

// Layout
write(`${APP}/layout.tsx`, `"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Settings, Mail, MessageSquare, BarChart3, Home, ClipboardList } from "lucide-react";

const navItems = [
  { href: "/notifications", label: "Dashboard", icon: Home },
  { href: "/notifications/inbox", label: "Inbox", icon: Bell },
  { href: "/notifications/communication", label: "Messages", icon: MessageSquare },
  { href: "/notifications/preferences", label: "Preferences", icon: Settings },
  { href: "/notifications/templates", label: "Templates", icon: ClipboardList },
  { href: "/notifications/queue", label: "Queue", icon: Mail },
  { href: "/notifications/analytics", label: "Analytics", icon: BarChart3 },
];

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className={\`bg-white border-r border-gray-200 transition-all \${collapsed ? "w-16" : "w-64"} hidden md:flex flex-col\`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!collapsed && <h2 className="font-bold text-lg text-gray-800">Notifications</h2>}
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
write(`${APP}/page.tsx`, `"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, Mail, CheckCircle, Clock, XCircle } from "lucide-react";

export default function NotificationsDashboard() {
  const [stats, setStats] = useState({ total: 0, unread: 0, pending: 0, failed: 0, today: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications/stats")
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total Notifications", value: stats.total, icon: Bell, color: "bg-blue-500", href: "/notifications/inbox" },
    { label: "Unread", value: stats.unread, icon: AlertTriangle, color: "bg-orange-500", href: "/notifications/inbox" },
    { label: "Pending Delivery", value: stats.pending, icon: Clock, color: "bg-yellow-500", href: "/notifications/queue" },
    { label: "Failed Deliveries", value: stats.failed, icon: XCircle, color: "bg-red-500", href: "/notifications/queue" },
    { label: "Today's Alerts", value: stats.today, icon: Mail, color: "bg-purple-500", href: "/notifications/inbox" },
    { label: "Delivered", value: stats.total - stats.pending - stats.failed, icon: CheckCircle, color: "bg-green-500", href: "/notifications/inbox" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notification Center</h1>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
    fetch(\`/api/${apiPath}?q=\${encodeURIComponent(search)}&page=\${page}&limit=20\`)
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

write(`${APP}/inbox/page.tsx`, listPage('Inbox', 'notifications', 'notifications', ['Title', 'Type', 'Channel', 'Priority', 'Status', 'Date'], ['item.title', 'item.type', 'item.channel', 'item.priority', 'item.status', 'new Date(item.createdAt).toLocaleDateString()'], null));
write(`${APP}/templates/page.tsx`, listPage('Templates', 'templates', 'templates', ['Name', 'Type', 'Category', 'Active', 'Default'], ['item.name', 'item.templateType', 'item.category || "—"', 'item.isActive ? "Yes" : "No"', 'item.isDefault ? "Yes" : "No"'], '/notifications/templates/new'));
write(`${APP}/queue/page.tsx`, listPage('Delivery Queue', 'delivery-queue', 'queue', ['Notification', 'Channel', 'Priority', 'Status', 'Scheduled'], ['item.notificationId', 'item.channel', 'item.priority', 'item.status', 'item.scheduledFor ? new Date(item.scheduledFor).toLocaleDateString() : "—"'], null));
write(`${APP}/communication/page.tsx`, listPage('Messages', 'communication/threads', 'threads', ['Subject', 'Participants', 'Last Message', 'Archived'], ['item.subject', 'item.participants.length + " members"', 'item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleDateString() : "—"', 'item.isArchived ? "Yes" : "No"'], '/notifications/communication/new'));

// Preferences
write(`${APP}/preferences/page.tsx`, `"use client";

import { useEffect, useState } from "react";
import { Bell, Mail, Smartphone, MessageSquare } from "lucide-react";

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notification-preferences")
      .then(r => r.json())
      .then(d => { if (d.success) setPreferences(d.data.preferences); })
      .finally(() => setLoading(false));
  }, []);

  const channelIcons: Record<string, any> = { IN_APP: Bell, EMAIL: Mail, PUSH: Smartphone, SMS: MessageSquare };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notification Preferences</h1>
      {loading ? (
        <div className="p-8 text-center">Loading...</div>
      ) : preferences.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No preferences configured yet.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {preferences.map((pref: any) => (
            <div key={pref.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{pref.notificationType}</p>
                <div className="flex gap-2 mt-1">
                  {(pref.channels || []).map((ch: string) => {
                    const Icon = channelIcons[ch] || Bell;
                    return <span key={ch} className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded"><Icon className="w-3 h-3" />{ch}</span>;
                  })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={\`text-xs px-2 py-1 rounded \${pref.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}\`}>
                  {pref.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <span className="text-xs text-gray-500">{pref.digestFrequency}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`);

// Analytics
write(`${APP}/analytics/page.tsx`, `"use client";

import { useEffect, useState } from "react";

export default function NotificationAnalytics() {
  const [stats, setStats] = useState({ total: 0, unread: 0, pending: 0, failed: 0, today: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications/stats")
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;

  const successRate = stats.total > 0 ? Math.round(((stats.total - stats.pending - stats.failed) / stats.total) * 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notification Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
            <p className="text-2xl font-bold text-gray-900">{String(value)}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Delivery Success Rate: {successRate}%</h3>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: \`\${successRate}%\` }} />
        </div>
      </div>
    </div>
  );
}
`);

console.log('Phase 14 frontend pages created');
