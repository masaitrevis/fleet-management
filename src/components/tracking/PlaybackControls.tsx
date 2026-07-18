'use client';

import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onReset: () => void;
  onEnd: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export default function PlaybackControls({ isPlaying, onPlay, onReset, onEnd, speed, onSpeedChange }: PlaybackControlsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-center gap-2">
        <button onClick={onReset} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors" title="Reset">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={onPlay} className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors" title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button onClick={onEnd} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors" title="End">
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-gray-500">Speed:</span>
        {[1, 2, 4, 8].map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              speed === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
