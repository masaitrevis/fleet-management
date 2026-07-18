import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendIndicatorProps {
  value: number;
  label?: string;
}

export function TrendIndicator({ value, label }: TrendIndicatorProps) {
  return (
    <div className="flex items-center gap-1">
      {value > 0 ? (
        <>
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-green-600">+{value}%{label ? ` ${label}` : ""}</span>
        </>
      ) : value < 0 ? (
        <>
          <TrendingDown className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-red-600">{value}%{label ? ` ${label}` : ""}</span>
        </>
      ) : (
        <>
          <Minus className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-500">0%{label ? ` ${label}` : ""}</span>
        </>
      )}
    </div>
  );
}
