"use client";
import { useState } from "react";
import { Send, MessageSquare } from "lucide-react";

export default function CustomerSupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/customer/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });
    if (res.ok) {
      setSubmitted(true);
      setSubject("");
      setMessage("");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 Center</h1>
      {submitted && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700
          Support request submitted successfully!
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-4
        <div>
          <label className="block text-sm font-medium text-gray-700
          <input value={subject} onChange={(e) => setSubject(e.target.value)} required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm />
        </div>
        <button type="submit" className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Send className="h-4 w-4" /> Submit Request
        </button>
      </form>
    </div>
  );
}
