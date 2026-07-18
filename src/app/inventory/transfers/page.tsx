"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/inventory/transfers?q=${encodeURIComponent(search)}&page=${page}&limit=20`)
      .then(r => r.json())
      .then(d => { if (d.success) { setItems(d.data.transfers); setTotal(d.data.total); } })
      .finally(() => setLoading(false));
  }, [search, page]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transfers</h1>
        
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No transfers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr><th className="px-4 py-3 text-left font-medium">Transfer #</th><th className="px-4 py-3 text-left font-medium">From</th><th className="px-4 py-3 text-left font-medium">To</th><th className="px-4 py-3 text-left font-medium">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{item.transferNumber}</td>
                    <td className="px-4 py-3 text-gray-700">{item.sourceWarehouse?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{item.destinationWarehouse?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 20 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
