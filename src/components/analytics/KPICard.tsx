import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
  trend?: number;
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  purple: "bg-purple-50 text-purple-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  orange: "bg-orange-50 text-orange-600",
  teal: "bg-teal-50 text-teal-600",
  indigo: "bg-indigo-50 text-indigo-600",
};

export function KPICard({ title, value, icon: Icon, color, subtitle, trend }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-3">
          {trend > 0 ? (
            <>
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600">+{trend}% from last period</span>
            </>
          ) : trend < 0 ? (
            <>
              <TrendingDown className="w-3 h-3 text-red-500" />
              <span className="text-xs text-red-600">{trend}% from last period</span>
            </>
          ) : (
            <>
              <Minus className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">No change</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
