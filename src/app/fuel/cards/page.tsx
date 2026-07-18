'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, CreditCard, AlertTriangle } from 'lucide-react';

export default function FuelCardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fuel/cards');
      const data = await res.json();
      if (data.success) setCards(data.data.cards || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCards(); }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuel Cards</h1>
          <p className="text-gray-600 mt-1">Manage fuel card assignments and limits</p>
        </div>
        <button
          onClick={() => router.push('/fuel/cards/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Fuel Card
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
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Card Number</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Holder</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Limits</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Expiry</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cards.map((card: any) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        {card.cardNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3">{card.cardHolderName || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-600 text-xs">
                        <div>Daily: KES {card.dailyLimit?.toLocaleString() || 0}</div>
                        <div>Monthly: KES {card.monthlyLimit?.toLocaleString() || 0}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {card.expiryDate ? new Date(card.expiryDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        card.status === 'ACTIVE' ? 'bg-green-50 text-green-600' :
                        card.status === 'BLOCKED' ? 'bg-red-50 text-red-600' :
                        card.status === 'EXPIRED' ? 'bg-gray-50 text-gray-600' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>
                        {card.status === 'BLOCKED' && <AlertTriangle className="w-3 h-3" />}
                        {card.status}
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
