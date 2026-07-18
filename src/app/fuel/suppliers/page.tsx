'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Phone, Mail } from 'lucide-react';

export default function FuelSuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fuel/suppliers');
      const data = await res.json();
      if (data.success) setSuppliers(data.data.suppliers || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuel Suppliers</h1>
          <p className="text-gray-600 mt-1">Manage fuel suppliers and contracts</p>
        </div>
        <button
          onClick={() => router.push('/fuel/suppliers/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Contract</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.map((supplier: any) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{supplier.name}</div>
                      <div className="text-gray-500 text-xs">{supplier.contactName || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 text-gray-600">
                        {supplier.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {supplier.email}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {supplier.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{supplier.contractNumber || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        supplier.status === 'ACTIVE' ? 'bg-green-50 text-green-600' :
                        supplier.status === 'INACTIVE' ? 'bg-gray-50 text-gray-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {supplier.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
