const fs = require('fs');
const path = require('path');

const APP = '/root/.openclaw/workspace/fleet-management-saas/src/app/compliance';

function mkdir(p) { fs.mkdirSync(p, { recursive: true }); }
function write(f, c) { mkdir(path.dirname(f)); fs.writeFileSync(f, c); }

// Layout
write(`${APP}/layout.tsx`, `"use client";

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
      <aside className={\`bg-white border-r border-gray-200 transition-all \${collapsed ? "w-16" : "w-64"} hidden md:flex flex-col\`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!collapsed && <h2 className="font-bold text-lg text-gray-800">Compliance</h2>}
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
import { Shield, AlertTriangle, CheckCircle, FileText, ClipboardCheck, TrendingUp } from "lucide-react";

export default function ComplianceDashboard() {
  const [stats, setStats] = useState({ complianceScore: 0, totalRules: 0, openIncidents: 0, pendingActions: 0, overdueActions: 0, expiringDocs: 0, totalInspections: 0, failedInspections: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/compliance/analytics").then(r => r.json()),
      fetch("/api/compliance/analytics/score").then(r => r.json()),
    ]).then(([overview, score]) => {
      if (overview.success) setStats(s => ({ ...s, ...overview.data }));
      if (score.success) setStats(s => ({ ...s, complianceScore: score.data.score }));
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Compliance Score", value: stats.complianceScore + "%", icon: Shield, color: stats.complianceScore >= 80 ? "bg-green-500" : stats.complianceScore >= 50 ? "bg-yellow-500" : "bg-red-500", href: "/compliance/analytics" },
    { label: "Open Incidents", value: stats.openIncidents, icon: AlertTriangle, color: "bg-red-500", href: "/compliance/incidents" },
    { label: "Pending Actions", value: stats.pendingActions, icon: CheckCircle, color: "bg-orange-500", href: "/compliance/corrective-actions" },
    { label: "Overdue Actions", value: stats.overdueActions, icon: TrendingUp, color: "bg-purple-500", href: "/compliance/corrective-actions" },
    { label: "Expiring Docs", value: stats.expiringDocs, icon: FileText, color: "bg-blue-500", href: "/compliance/vehicle-documents" },
    { label: "Failed Inspections", value: stats.failedInspections, icon: ClipboardCheck, color: "bg-red-500", href: "/compliance/inspections" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Compliance Dashboard</h1>
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

// Generic list page generator
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

write(`${APP}/rules/page.tsx`, listPage('Compliance Rules', 'compliance/rules', 'rules', ['Name', 'Type', 'Applies To', 'Status', 'Priority'], ['item.name', 'item.ruleType', 'item.appliesTo', 'item.status', 'item.priority'], '/compliance/rules/new'));
write(`${APP}/inspections/page.tsx`, listPage('Inspections', 'inspections', 'inspections', ['Vehicle', 'Type', 'Date', 'Result', 'Score'], ['item.vehicle?.registrationNumber || "—"', 'item.inspectionType', 'new Date(item.inspectionDate).toLocaleDateString()', 'item.result', 'item.score || "—"'], null));
write(`${APP}/incidents/page.tsx`, listPage('Incidents', 'incidents', 'incidents', ['Number', 'Title', 'Type', 'Severity', 'Status'], ['item.incidentNumber', 'item.title', 'item.incidentType', 'item.severity', 'item.status'], '/compliance/incidents/new'));
write(`${APP}/corrective-actions/page.tsx`, listPage('Corrective Actions', 'corrective-actions', 'actions', ['Title', 'Assigned To', 'Due Date', 'Status'], ['item.title', 'item.assignee?.firstName + " " + item.assignee?.lastName || "—"', 'item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "—"', 'item.status'], null));
write(`${APP}/approvals/page.tsx`, listPage('Approval Requests', 'approvals/requests', 'requests', ['Workflow', 'Type', 'Entity', 'Status'], ['item.workflow?.name || "—"', 'item.entityType', 'item.entityId', 'item.status'], null));

// Analytics page
write(`${APP}/analytics/page.tsx`, `"use client";

import { useEffect, useState } from "react";

export default function ComplianceAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/compliance/analytics").then(r => r.json()),
      fetch("/api/compliance/analytics/score").then(r => r.json()),
      fetch("/api/compliance/analytics/trends").then(r => r.json()),
    ]).then(([overview, score, trends]) => {
      setData({ overview: overview.data, score: score.data, trends: trends.data });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center">Failed to load.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Compliance Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(data.overview || {}).map(([key, value]) => (
          <div key={key} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
            <p className="text-2xl font-bold text-gray-900">{String(value)}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Compliance Score: {data.score?.score}%</h3>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: \`\${data.score?.score}%\` }} />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Incident Trends by Type</h3>
        <div className="space-y-2">
          {(data.trends || []).map((t: any) => (
            <div key={t.incidentType} className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">{t.incidentType}</span>
              <span className="text-sm font-medium text-gray-900">{t._count?.id || 0} incidents</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`);

// Vehicle Documents redirect
write(`${APP}/vehicle-documents/page.tsx`, `"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VehicleDocumentsRedirect() {
  const router = useRouter();
  useEffect(() => { router.push("/dashboard/vehicles"); }, [router]);
  return <div className="p-8 text-center">Redirecting...</div>;
}
`);

// Driver Documents redirect
write(`${APP}/driver-documents/page.tsx`, `"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DriverDocumentsRedirect() {
  const router = useRouter();
  useEffect(() => { router.push("/dashboard/drivers"); }, [router]);
  return <div className="p-8 text-center">Redirecting...</div>;
}
`);

console.log('Phase 13 frontend pages created');
