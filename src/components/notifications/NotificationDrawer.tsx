import React from 'react';
import { X, Check, Archive, Trash2, Bell } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkReadAll: () => void;
}

export function NotificationDrawer({ open, onClose, notifications, onMarkRead, onArchive, onDelete, onMarkReadAll }: NotificationDrawerProps) {
  if (!open) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-50 border-red-200';
      case 'HIGH': return 'bg-orange-50 border-orange-200';
      case 'LOW': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onMarkReadAll} className="text-sm text-blue-600 hover:text-blue-800">Mark all read</button>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No notifications</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`p-3 rounded-lg border ${getPriorityColor(n.priority)} ${n.status === 'READ' ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {n.status !== 'READ' && (
                      <button onClick={() => onMarkRead(n.id)} className="p-1 hover:bg-white/50 rounded" title="Mark read">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => onArchive(n.id)} className="p-1 hover:bg-white/50 rounded" title="Archive">
                      <Archive className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(n.id)} className="p-1 hover:bg-white/50 rounded text-red-500" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
