'use client';

import { Fuel, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';

interface FuelDashboardCardsProps {
  totalFuelConsumed?: number;
  totalFuelCost?: number;
  avgConsumption?: number;
  activeFraudAlerts?: number;
}

export default function FuelDashboardCards({
  totalFuelConsumed = 0,
  totalFuelCost = 0,
  avgConsumption = 0,
  activeFraudAlerts = 0,
}: FuelDashboardCardsProps) {
  const cards = [
    {
      title: 'Total Fuel Consumed',
      value: `${totalFuelConsumed.toFixed(1)} L`,
      icon: Fuel,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Total Fuel Cost',
      value: `KES ${totalFuelCost.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Avg Consumption',
      value: `${avgConsumption.toFixed(1)} L/100km`,
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Fraud Alerts',
      value: activeFraudAlerts.toString(),
      icon: AlertTriangle,
      color: activeFraudAlerts > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
            <div className={`p-2 rounded-lg ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
