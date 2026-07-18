"use client";

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
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
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
