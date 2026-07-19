'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  searchable?: boolean;
  searchKeys?: string[];
  loading?: boolean;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  searchable = false,
  searchKeys = [],
  loading,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  let filtered = data;
  if (searchable && search) {
    const s = search.toLowerCase();
    filtered = data.filter((item) =>
      searchKeys.some((k) => {
        const val = (item as any)[k];
        return val !== undefined && String(val).toLowerCase().includes(s);
      })
    );
  }

  if (sortKey) {
    filtered = [...filtered].sort((a: any, b: any) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
        <div className="h-10 bg-gray-100 />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 border-t border-gray-100 />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {searchable && (
        <div className="p-3 border-b border-gray-200
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-4 py-3 text-left font-medium text-gray-700 ${col.sortable ? 'cursor-pointer select-none hover:bg-gray-100 : ''}`}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500
                  No records found
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={keyExtractor(item)} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-900
                      {col.render ? col.render(item) : String((item as any)[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
