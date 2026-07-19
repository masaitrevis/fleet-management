'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';

interface ConfigItem {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string | null;
  isEncrypted: boolean;
}

export default function SystemConfigPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/system-config')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setConfigs(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = (key: string, value: string) => {
    fetch('/api/admin/system-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    }).then(() => {
      setConfigs(configs.map((c) => (c.key === key ? { ...c, value } : c)));
    });
  };

  const grouped = configs.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {} as Record<string, ConfigItem[]>);

  return (
    <div>
      <AdminHeader title="System Configuration" subtitle="Manage global platform settings" />
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded" />)}
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 capitalize">{category}</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-700
                      {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                    </div>
                    <input
                      type={item.isEncrypted ? 'password' : 'text'}
                      defaultValue={item.value}
                      onBlur={(e) => handleUpdate(item.key, e.target.value)}
                      className="w-64 px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-900
                    />
                    <button className="p-1.5 rounded hover:bg-gray-100
                      <Save className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
