'use client';

interface TimelineSliderProps {
  current: number;
  total: number;
  onChange: (value: number) => void;
}

export default function TimelineSlider({ current, total, onChange }: TimelineSliderProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(0, total - 1)}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-2 accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Start</span>
        <span>{current + 1} / {total}</span>
        <span>End</span>
      </div>
    </div>
  );
}
