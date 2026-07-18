"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Archive, Trash2, Search, Filter, RefreshCw, MailOpen, Inbox } from "lucide-react";
import { AlertBanner } from "@/components/notifications/AlertBanner";
import { ToastContainer, ToastType } from "@/components/notifications/Toast";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  priority: string;
  status: string;
  channel: string;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

export default function NotificationInbox() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "archived">("all");
  const [toasts, setToasts] = useState<{ id: string; message: string; type: ToastType }[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const addToast = (message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const statusQuery = filter !== "all" ? `&status=${filter.toUpperCase()}` : "";
      const res = await fetch(`/api/notifications?q=${encodeURIComponent(search)}&page=${page}&limit=20${statusQuery}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data.notifications);
        setTotal(data.data.total);
      }
    } catch {
      addToast("Failed to load notifications", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [search, page, filter]);

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      if (res.ok) { addToast("Marked as read", "success"); fetchNotifications(); }
    } catch { addToast("Failed to mark read", "error"); }
  };

  const handleMarkReadAll = async () => {
    try {
      const res = await fetch(`/api/notifications/read-all`, { method: "PUT" });
      if (res.ok) { addToast("All marked as read", "success"); fetchNotifications(); }
    } catch { addToast("Failed to mark all read", "error"); }
  };

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ARCHIVED" }) });
      if (res.ok) { addToast("Archived", "success"); fetchNotifications(); }
    } catch { addToast("Failed to archive", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this notification?")) return;
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) { addToast("Deleted", "success"); fetchNotifications(); }
    } catch { addToast("Failed to delete", "error"); }
  };

  const handleBulkAction = async (action: "read" | "archive" | "delete") => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    if (action === "delete" && !confirm(`Delete ${ids.length} notifications?`)) return;

    try {
      const promises = ids.map((id) => {
        if (action === "read") return fetch(`/api/notifications/${id}/read`, { method: "PUT" });
        if (action === "archive") return fetch(`/api/notifications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ARCHIVED" }) });
        return fetch(`/api/notifications/${id}`, { method: "DELETE" });
      });
      await Promise.all(promises);
      addToast(`${action === "read" ? "Marked read" : action === "archive" ? "Archived" : "Deleted"} ${ids.length} items`, "success");
      setSelectedIds(new Set());
      fetchNotifications();
    } catch {
      addToast("Bulk action failed", "error");
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === items.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map((i) => i.id)));
  };

  const priorityColors: Record<string, string> = {
    CRITICAL: "bg-red-50 border-red-200",
    HIGH: "bg-orange-50 border-orange-200",
    LOW: "bg-blue-50 border-blue-200",
    NORMAL: "bg-gray-50 border-gray-200",
  };

  const unreadCount = items.filter((i) => i.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      {unreadCount > 0 && (
        <AlertBanner
          message={`You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`}
          type="info"
          onDismiss={handleMarkReadAll}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Inbox</h1>
          <p className="text-sm text-gray-500">{total} total · {unreadCount} unread</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleMarkReadAll} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
            <MailOpen className="w-4 h-4" /> Mark All Read
          </button>
          <button onClick={fetchNotifications} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              {(["all", "unread", "read", "archived"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setPage(1); }}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${filter === f ? "bg-blue-50 text-blue-700 border-blue-200" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">{selectedIds.size} selected</span>
              <button onClick={() => handleBulkAction("read")} className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"><Check className="w-3 h-3" /> Read</button>
              <button onClick={() => handleBulkAction("archive")} className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"><Archive className="w-3 h-3" /> Archive</button>
              <button onClick={() => handleBulkAction("delete")} className="flex items-center gap-1 px-2 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 className="w-3 h-3" /> Delete</button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading notifications...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications found.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
              <input
                type="checkbox"
                checked={selectedIds.size === items.length && items.length > 0}
                onChange={selectAll}
                className="rounded border-gray-300"
              />
              <span className="text-xs text-gray-500">Select all</span>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${item.status === "PENDING" ? "font-medium" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="mt-1 rounded border-gray-300"
                    />
                    <div className={`flex-1 p-3 rounded-lg border ${priorityColors[item.priority] || priorityColors.NORMAL}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {item.status === "PENDING" && (
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                            )}
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{item.type}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${item.priority === "CRITICAL" ? "bg-red-100 text-red-700" : item.priority === "HIGH" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
                              {item.priority}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mt-1">{item.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{item.body}</p>
                          {item.actionUrl && (
                            <a href={item.actionUrl} className="inline-block mt-2 text-sm text-blue-600 hover:underline">
                              {item.actionLabel || "View Details"}
                            </a>
                          )}
                          <p className="text-xs text-gray-400 mt-2">{new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {item.status === "PENDING" && (
                            <button onClick={() => handleMarkRead(item.id)} className="p-1.5 hover:bg-white/50 rounded" title="Mark read">
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleArchive(item.id)} className="p-1.5 hover:bg-white/50 rounded" title="Archive">
                            <Archive className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-white/50 rounded text-red-500" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {total > 20 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm">Previous</button>
            <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total} className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
