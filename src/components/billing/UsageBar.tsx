"use client";
interface UsageBarProps {
  label: string;
  current: number;
  limit: number | null;
  unit?: string;
}

export function UsageBar({ label, current, limit, unit = "" }: UsageBarProps) {
  const percentage = limit && limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const isExceeded = limit !== null && current > limit;

  let colorClass = "bg-blue-500";
  if (percentage > 90) colorClass = "bg-red-500";
  else if (percentage > 75) colorClass = "bg-amber-500";
  else if (percentage > 50) colorClass = "bg-green-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700
        <span className={`text-sm ${isExceeded ? "text-red-600 font-semibold" : "text-gray-500
          {current.toLocaleString()} {unit}
          {limit !== null && ` / ${limit.toLocaleString()} ${unit}`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isExceeded && (
        <p className="text-xs text-red-600">Limit exceeded. Upgrade your plan to increase capacity.</p>
      )}
    </div>
  );
}
