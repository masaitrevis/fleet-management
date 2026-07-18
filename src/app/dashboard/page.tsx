'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Users, MapPin, Briefcase, Shield, Mail, ArrowRight } from 'lucide-react';

interface Stats {
  users: number;
  branches: number;
  departments: number;
  roles: number;
  pendingInvitations: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // In a real app, you'd fetch this from an aggregated endpoint
    setStats({ users: 12, branches: 3, departments: 5, roles: 6, pendingInvitations: 2 });
  }, []);

  const cards = [
    { href: '/dashboard/company', label: 'Company Profile', icon: Building2, count: null, color: 'bg-blue-50 text-blue-600' },
    { href: '/dashboard/branches', label: 'Branches', icon: MapPin, count: stats?.branches, color: 'bg-green-50 text-green-600' },
    { href: '/dashboard/departments', label: 'Departments', icon: Briefcase, count: stats?.departments, color: 'bg-purple-50 text-purple-600' },
    { href: '/dashboard/users', label: 'Team Members', icon: Users, count: stats?.users, color: 'bg-orange-50 text-orange-600' },
    { href: '/dashboard/roles', label: 'Roles', icon: Shield, count: stats?.roles, color: 'bg-pink-50 text-pink-600' },
    { href: '/dashboard/invitations', label: 'Pending Invitations', icon: Mail, count: stats?.pendingInvitations, color: 'bg-yellow-50 text-yellow-600' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your fleet.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                <card.icon className="w-6 h-6" />
              </div>
              {card.count !== null && (
                <span className="text-2xl font-bold text-gray-900">{card.count}</span>
              )}
            </div>
            <div className="flex items-center justify-between mt-4">
              <h3 className="font-medium text-gray-900">{card.label}</h3>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 rounded-xl border border-blue-100 p-6">
        <h3 className="font-medium text-blue-900 mb-2">Getting Started</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-medium">1</div>
            Complete your <Link href="/dashboard/company" className="underline">company profile</Link>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-medium">2</div>
            Add your <Link href="/dashboard/branches" className="underline">branches and locations</Link>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-medium">3</div>
            Invite your <Link href="/dashboard/users" className="underline">team members</Link>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-medium">4</div>
            Configure <Link href="/dashboard/roles" className="underline">roles and permissions</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
