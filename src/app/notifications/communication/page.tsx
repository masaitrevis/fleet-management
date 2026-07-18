"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send, Search, User } from "lucide-react";

interface Thread {
  id: string;
  subject: string;
  participantCount: number;
  lastMessageAt?: string;
  createdAt: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  body: string;
  createdAt: string;
}

export default function CommunicationPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");

  const fetchThreads = async () => {
    try {
      const res = await fetch("/api/communication-center");
      const data = await res.json();
      if (data.success) setThreads(data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const fetchMessages = async (threadId: string) => {
    try {
      const res = await fetch(`/api/communication-center/${threadId}/messages`);
      const data = await res.json();
      if (data.success) setMessages(data.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchThreads(); }, []);

  useEffect(() => {
    if (activeThread) fetchMessages(activeThread.id);
  }, [activeThread]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !newMessage.trim()) return;
    try {
      const res = await fetch(`/api/communication-center/${activeThread.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newMessage }),
      });
      if (res.ok) {
        setNewMessage("");
        fetchMessages(activeThread.id);
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="h-[calc(100vh-120px)] bg-white rounded-xl border border-gray-200 shadow-sm flex overflow-hidden">
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Conversations</h2>
        </div>
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No conversations</p>
            </div>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveThread(t)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${activeThread?.id === t.id ? "bg-blue-50 border-blue-200" : ""}`}
              >
                <p className="font-medium text-sm truncate">{t.subject}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  <span>{t.participantCount} participants</span>
                  {t.lastMessageAt && <span>· {new Date(t.lastMessageAt).toLocaleDateString()}</span>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {activeThread ? (
          <>
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{activeThread.subject}</h3>
              <p className="text-xs text-gray-500">{activeThread.participantCount} participants</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{m.senderName || "Unknown"}</span>
                      <span className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{m.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
