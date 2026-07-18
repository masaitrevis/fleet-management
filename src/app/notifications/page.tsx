"use client";

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
