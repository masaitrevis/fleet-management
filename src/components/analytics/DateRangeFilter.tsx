import { Calendar } from "lucide-react";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onApply: () => void;
}

export function DateRangeFilter({ startDate, endDate, onStartDateChange, onEndDateChange, onApply }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
      <Calendar className="w-4 h-4 text-gray-400" />
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="text-sm border-none focus:outline-none bg-transparent"
        placeholder="Start date"
      />
      <span className="text-gray-300">–</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="text-sm border-none focus:outline-none bg-transparent"
        placeholder="End date"
      />
      <button
        onClick={onApply}
        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Apply
      </button>
    </div>
  );
}
