"use client";
import { useEffect, useState } from "react";
import { User, Save } from "lucide-react";

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/customer/profile")
      .then((r) => r.json())
      .then((json) => { if (json.success) setProfile(json.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
  };

  if (loading) return <div className="text-center">Loading profile...</div>;
  if (!profile) return <div className="text-center">Profile not found</div>;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>
        <div className="space-y-3">
          {["name", "phone", "address", "city", "country"].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium capitalize text-gray-700 dark:text-gray-300">{field}</label>
              <input
                value={profile[field] || ""}
                onChange={(e) => setProfile({ ...profile, [field]: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
