import React from 'react';

interface ServiceTemplateTableProps {
  templates: Array<{
    id: string;
    name: string;
    templateType: string;
    estimatedDuration: number | null;
    estimatedCost: number | null;
    isActive: boolean;
    sortOrder: number;
    _count?: { serviceTemplateItems?: number };
  }>;
}

export function ServiceTemplateTable({ templates }: ServiceTemplateTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Duration</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Cost</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {templates.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                No templates found
              </td>
            </tr>
          )}
          {templates.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{t.templateType.replace(/_/g, ' ')}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{t.estimatedDuration ? `${t.estimatedDuration}h` : '—'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {t.estimatedCost ? `KES ${t.estimatedCost.toLocaleString()}` : '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {t._count?.serviceTemplateItems ?? 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {t.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
