import React from 'react';

interface WorkshopTableProps {
  workshops: Array<{
    id: string;
    name: string;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    isActive: boolean;
    isInternal: boolean;
    rating: number | null;
  }>;
}

export function WorkshopTable({ workshops }: WorkshopTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Internal</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {workshops.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                No workshops found
              </td>
            </tr>
          )}
          {workshops.map((w) => (
            <tr key={w.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{w.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{w.contactName || '—'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{w.email || '—'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{w.phone || '—'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{w.city || '—'}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${w.isInternal ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {w.isInternal ? 'Internal' : 'External'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {w.rating ? `${w.rating}/5` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
