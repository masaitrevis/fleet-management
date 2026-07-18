'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Mail, Clock, CheckCircle, XCircle, RefreshCw, X, Send } from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  invitedBy: { firstName: string; lastName: string };
  roles: { role: { name: string } }[];
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ email: '', firstName: '', lastName: '', roleIds: [] as string[], message: '' });

  useEffect(() => { fetchInvitations(); }, []);

  const fetchInvitations = async () => {
    try {
      const res = await fetch('/api/invitations');
      const data = await res.json();
      if (data.success) setInvitations(data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/invitations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (data.success) { setShowModal(false); setFormData({ email: '', firstName: '', lastName: '', roleIds: [], message: '' }); fetchInvitations(); }
    } catch (error) { console.error(error); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this invitation?')) return;
    try { const res = await fetch(`/api/invitations/${id}`, { method: 'DELETE' }); if (res.ok) fetchInvitations(); }
    catch (error) { console.error(error); }
  };

  const handleResend = async (id: string) => {
    try { const res = await fetch(`/api/invitations/${id}`, { method: 'POST' }); if (res.ok) fetchInvitations(); }
    catch (error) { console.error(error); }
  };

  const statusIcons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="w-4 h-4 text-yellow-600" />,
    ACCEPTED: <CheckCircle className="w-4 h-4 text-green-600" />,
    EXPIRED: <XCircle className="w-4 h-4 text-red-600" />,
    CANCELLED: <XCircle className="w-4 h-4 text-gray-400" />,
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    EXPIRED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
  };

  const filtered = invitations.filter(i => i.email.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-gray-900">Invitations</h1><p className="text-gray-600 mt-1">Send and manage team invitations</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" />Invite User</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search invitations..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full md:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filtered.map((inv) => (
            <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{inv.firstName} {inv.lastName}</span>
                    <span className="text-sm text-gray-500">{inv.email}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">{statusIcons[inv.status]}<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status]}`}>{inv.status}</span></span>
                    <span>Invited by {inv.invitedBy.firstName} {inv.invitedBy.lastName}</span>
                    <span>Expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {inv.roles.map((r, i) => <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">{r.role.name}</span>)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {inv.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleResend(inv.id)} className="p-1.5 rounded hover:bg-gray-100" title="Resend"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
                    <button onClick={() => handleCancel(inv.id)} className="p-1.5 rounded hover:bg-red-50" title="Cancel"><X className="w-4 h-4 text-red-500" /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Invite User</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name</label><input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label><input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label><textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Personal message to include in the invitation..." /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Send className="w-4 h-4" />Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
