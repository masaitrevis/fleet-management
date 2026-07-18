'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface FraudAlert {
  id: string;
  fuelLog: { vehicle: { registrationNumber: string } };
  fraudType: string;
  status: string;
  confidenceScore: number;
  description: string;
  detectedAt: string;
}

interface FraudAlertTableProps {
  alerts: FraudAlert[];
  onUpdateStatus?: (id: string, status: string) => void;
}

export function FraudAlertBadge({ status }: { status: string }) {
  const config = {
    OPEN: { color: 'bg-yellow-50 text-yellow-600', icon: Clock },
    INVESTIGATING: { color: 'bg-blue-50 text-blue-600', icon: AlertTriangle },
    CONFIRMED: { color: 'bg-red-50 text-red-600', icon: XCircle },
    FALSE_POSITIVE: { color: 'bg-green-50 text-green-600', icon: CheckCircle },
    DISMISSED: { color: 'bg-gray-50 text-gray-600', icon: CheckCircle },
  };

  const { color, icon: Icon } = config[status as keyof typeof config] || config.OPEN;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

export default function FraudAlertTable({ alerts, onUpdateStatus }: FraudAlertTableProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Vehicle</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Confidence</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Detected</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {alerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {alert.fuelLog.vehicle.registrationNumber}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
                    {alert.fraudType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${alert.confidenceScore}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{alert.confidenceScore}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <FraudAlertBadge status={alert.status} />
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(alert.detectedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => router.push(`/fuel/fraud/${alert.id}`)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      View
                    </button>
                    {onUpdateStatus && alert.status === 'OPEN' && (
                      <>
                        <button
                          onClick={() => onUpdateStatus(alert.id, 'INVESTIGATING')}
                          className="px-3 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          Investigate
                        </button>
                        <button
                          onClick={() => onUpdateStatus(alert.id, 'DISMISSED')}
                          className="px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
