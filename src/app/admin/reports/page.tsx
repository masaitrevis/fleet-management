'use client';

import { FileBarChart, Building2, CreditCard, Users, Shield, Activity, Download } from 'lucide-react';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  iconColor: string;
  lastGenerated: string;
  formats: string[];
}

const reports: ReportCard[] = [
  {
    id: '1',
    title: 'Platform Usage',
    description: 'Active users, companies, vehicles, and trips over time',
    icon: Activity,
    iconColor: 'bg-blue-50 text-blue-600',
    lastGenerated: '2026-07-18',
    formats: ['CSV', 'Excel'],
  },
  {
    id: '2',
    title: 'Revenue Summary',
    description: 'Monthly recurring revenue, churn, and ARPU by plan',
    icon: CreditCard,
    iconColor: 'bg-emerald-50 text-emerald-600',
    lastGenerated: '2026-07-18',
    formats: ['CSV', 'Excel', 'PDF'],
  },
  {
    id: '3',
    title: 'Tenant Activity',
    description: 'Signups, activations, suspensions, and engagement metrics',
    icon: Building2,
    iconColor: 'bg-purple-50 text-purple-600',
    lastGenerated: '2026-07-17',
    formats: ['CSV', 'Excel'],
  },
  {
    id: '4',
    title: 'API Usage',
    description: 'Request volume, latency, error rates, and endpoint breakdown',
    icon: Activity,
    iconColor: 'bg-indigo-50 text-indigo-600',
    lastGenerated: '2026-07-18',
    formats: ['CSV', 'Excel'],
  },
  {
    id: '5',
    title: 'Security Report',
    description: 'Login attempts, blocked IPs, suspicious events, and alerts',
    icon: Shield,
    iconColor: 'bg-red-50 text-red-600',
    lastGenerated: '2026-07-16',
    formats: ['CSV', 'PDF'],
  },
  {
    id: '6',
    title: 'Queue Performance',
    description: 'Job throughput, failure rates, and queue depth trends',
    icon: Activity,
    iconColor: 'bg-amber-50 text-amber-600',
    lastGenerated: '2026-07-18',
    formats: ['CSV', 'Excel'],
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900
        <p className="text-sm text-gray-500 mt-1">Generate and export platform reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
            <div className="flex items-start justify-between">
              <div className={`p-2.5 rounded-lg ${report.iconColor}`}>
                <report.icon className="w-6 h-6" />
              </div>
              <span className="text-xs text-gray-400">Last: {report.lastGenerated}</span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mt-3">{report.title}</h3>
            <p className="text-sm text-gray-500 mt-1 flex-1">{report.description}</p>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100
              {report.formats.map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => alert(`Export ${report.title} as ${fmt}`)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
