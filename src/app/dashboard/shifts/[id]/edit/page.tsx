'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sun, Moon, SplitSquareHorizontal, CalendarDays, Calendar, Clock, Loader2 } from 'lucide-react';

const typeOptions = [
  { value: 'DAY', label: 'Day', icon: Sun, color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: 'NIGHT', label: 'Night', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { value: 'SPLIT', label: 'Split', icon: SplitSquareHorizontal, color: 'text-purple-600', bg: 'bg-purple-50' },
  { value: 'WEEKEND', label: 'Weekend', icon: CalendarDays, color: 'text-green-600', bg: 'bg-green-50' },
  { value: 'HOLIDAY', label: 'Holiday', icon: Calendar, color: 'text-red-600', bg: 'bg-red-50' },
  { value: 'CUSTOM', label: 'Custom', icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' },
];

const dayOptions = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export default function EditShiftPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    name: '',
    shiftType: 'DAY',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 30,
    daysOfWeek: [1, 2, 3, 4, 5],
    isActive: true,
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) fetchShift();
  }, [id]);

  const fetchShift = async () => {
    try {
      const res = await fetch(`/api/shifts/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        const s = data.data;
        setForm({
          name: s.name || '',
          shiftType: s.shiftType || 'DAY',
          startTime: s.startTime || '08:00',
          endTime: s.endTime || '17:00',
          breakMinutes: s.breakMinutes || 30,
          daysOfWeek: s.daysOfWeek || [1, 2, 3, 4, 5],
          isActive: s.isActive ?? true,
          notes: s.notes || '',
        });
      } else {
        alert('Shift not found');
        router.push('/dashboard/shifts');
      }
    } catch (e) {
      alert('Failed to load shift');
      router.push('/dashboard/shifts');
    } finally {
      setFetching(false);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.startTime) errs.startTime = 'Start time is required';
    if (!form.endTime) errs.endTime = 'End time is required';
    if (form.daysOfWeek.length === 0) errs.daysOfWeek = 'Select at least one day';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/shifts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/dashboard/shifts');
      } else {
        alert(data.error?.message || 'Failed to update shift');
      }
    } catch (e) {
      alert('Failed to update shift');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/shifts" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Shift</h1>
          <p className="text-gray-600 mt-1">Update shift schedule details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Shift Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Morning Shift, Night Shift"
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Shift Type</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {typeOptions.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, shiftType: t.value })}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                    form.shiftType === t.value
                      ? `${t.bg} border-current ${t.color}`
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.startTime && <p className="text-sm text-red-600 mt-1">{errors.startTime}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.endTime && <p className="text-sm text-red-600 mt-1">{errors.endTime}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Break (minutes)</label>
            <input
              type="number"
              min={0}
              max={300}
              value={form.breakMinutes}
              onChange={(e) => setForm({ ...form, breakMinutes: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week *</label>
          <div className="flex flex-wrap gap-2">
            {dayOptions.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  form.daysOfWeek.includes(d.value)
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          {errors.daysOfWeek && <p className="text-sm text-red-600 mt-1">{errors.daysOfWeek}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional notes about this shift..."
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active shift</label>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Link href="/dashboard/shifts" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Updating...' : 'Update Shift'}
          </button>
        </div>
      </form>
    </div>
  );
}
