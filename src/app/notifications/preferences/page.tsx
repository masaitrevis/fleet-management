"use client";

import { useEffect, useState } from "react";
import { Bell, Mail, Smartphone, MessageSquare, Globe, Clock, Moon, Sun } from "lucide-react";
import { ToastContainer, ToastType } from "@/components/notifications/Toast";

interface Preferences {
  channels: { inApp: boolean; email: boolean; push: boolean; sms: boolean; webhook: boolean };
  categories: { fleet: boolean; maintenance: boolean; fuel: boolean; compliance: boolean; admin: boolean; billing: boolean; system: boolean };
  digest: { frequency: string; time: string };
  quietHours: { enabled: boolean; start: string; end: string };
  language: string;
  timezone: string;
}

const defaultPreferences: Preferences = {
  channels: { inApp: true, email: true, push: false, sms: false, webhook: false },
  categories: { fleet: true, maintenance: true, fuel: true, compliance: true, admin: true, billing: true, system: true },
  digest: { frequency: "IMMEDIATE", time: "09:00" },
  quietHours: { enabled: false, start: "22:00", end: "07:00" },
  language: "en",
  timezone: "UTC",
};

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: ToastType }[]>([]);

  const addToast = (message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  useEffect(() => {
    fetch("/api/notification-preferences")
      .then((r) => r.json())
      .then((d) => { if (d.success) setPrefs(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: JSON.stringify(prefs) }),
      });
      if (res.ok) addToast("Preferences saved", "success");
      else addToast("Failed to save", "error");
    } catch {
      addToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleChannel = (key: keyof Preferences["channels"]) => {
    setPrefs((p) => ({ ...p, channels: { ...p.channels, [key]: !p.channels[key] } }));
  };

  const toggleCategory = (key: keyof Preferences["categories"]) => {
    setPrefs((p) => ({ ...p, categories: { ...p.categories, [key]: !p.categories[key] } }));
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="text-sm text-gray-500">Customize how and when you receive notifications</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Channels</h2>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[
            { key: "inApp", label: "In-App", icon: MessageSquare, desc: "Notifications inside the app" },
            { key: "email", label: "Email", icon: Mail, desc: "Sent to your email address" },
            { key: "push", label: "Push", icon: Smartphone, desc: "Mobile push notifications" },
            { key: "sms", label: "SMS", icon: Smartphone, desc: "Text messages to your phone" },
            { key: "webhook", label: "Webhook", icon: Globe, desc: "HTTP callbacks to your systems" },
          ].map((ch) => {
            const Icon = ch.icon;
            const enabled = prefs.channels[ch.key as keyof Preferences["channels"]];
            return (
              <div key={ch.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enabled ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{ch.label}</p>
                    <p className="text-xs text-gray-500">{ch.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleChannel(ch.key as keyof Preferences["channels"])}
                  className={`w-12 h-6 rounded-full transition-colors ${enabled ? "bg-blue-600" : "bg-gray-300"}`}
                >
                  <span className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Digest Frequency</h2>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
            <select
              value={prefs.digest.frequency}
              onChange={(e) => setPrefs((p) => ({ ...p, digest: { ...p.digest, frequency: e.target.value } }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="IMMEDIATE">Immediate</option>
              <option value="HOURLY">Hourly Digest</option>
              <option value="DAILY">Daily Digest</option>
              <option value="WEEKLY">Weekly Digest</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Quiet Hours</h2>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-medium text-sm">Enable Quiet Hours</p>
                <p className="text-xs text-gray-500">Pause non-critical notifications during set hours</p>
              </div>
            </div>
            <button
              onClick={() => setPrefs((p) => ({ ...p, quietHours: { ...p.quietHours, enabled: !p.quietHours.enabled } }))}
              className={`w-12 h-6 rounded-full transition-colors ${prefs.quietHours.enabled ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${prefs.quietHours.enabled ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>
          {prefs.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input type="time" value={prefs.quietHours.start} onChange={(e) => setPrefs((p) => ({ ...p, quietHours: { ...p.quietHours, start: e.target.value } }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input type="time" value={prefs.quietHours.end} onChange={(e) => setPrefs((p) => ({ ...p, quietHours: { ...p.quietHours, end: e.target.value } }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Categories</h2>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(prefs.categories).map(([key, enabled]) => (
            <button
              key={key}
              onClick={() => toggleCategory(key as keyof Preferences["categories"])}
              className={`p-3 rounded-lg border text-sm font-medium text-left transition-colors ${enabled ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
