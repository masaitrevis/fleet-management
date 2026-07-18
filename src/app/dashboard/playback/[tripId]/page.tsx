'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Play, Pause, SkipBack, SkipForward, ArrowLeft, Clock, MapPin, Gauge } from 'lucide-react';
import Link from 'next/link';

interface PlaybackData {
  trip: any;
  locations: {
    id: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    timestamp: string;
  }[];
  telemetry: {
    id: string;
    speed?: number;
    fuelLevel?: number;
    ignition: boolean;
    timestamp: string;
  }[];
}

export default function PlaybackPage() {
  const params = useParams();
  const tripId = params?.tripId as string;
  const [data, setData] = useState<PlaybackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchData();
  }, [tripId]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (data && prev >= data.locations.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, speed, data]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/routes/playback/${tripId}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handlePlay = () => setIsPlaying(!isPlaying);
  const handleReset = () => { setIsPlaying(false); setCurrentIndex(0); };
  const handleEnd = () => { setIsPlaying(false); if (data) setCurrentIndex(data.locations.length - 1); };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!data || data.locations.length === 0) return (
    <div className="text-center p-8 text-gray-500">
      <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-300" />
      <p>No playback data available for this trip</p>
    </div>
  );

  const current = data.locations[currentIndex];
  const progress = data.locations.length > 0 ? (currentIndex / (data.locations.length - 1)) * 100 : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard/live" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Trip Playback</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-100 rounded-xl border border-gray-200 h-96 flex items-center justify-center relative">
          <div className="text-center p-8">
            <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <p className="font-medium text-gray-900">{current.latitude.toFixed(6)}, {current.longitude.toFixed(6)}</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {current.speed != null && <span className="px-3 py-1 bg-white rounded-full text-sm font-medium">{current.speed} km/h</span>}
              {current.heading != null && <span className="px-3 py-1 bg-white rounded-full text-sm font-medium">Heading: {current.heading}°</span>}
              <span className="px-3 py-1 bg-white rounded-full text-sm font-medium">{new Date(current.timestamp).toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Point {currentIndex + 1} of {data.locations.length}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Playback Controls</h2>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={handleReset} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><SkipBack className="w-4 h-4" /></button>
              <button onClick={handlePlay} className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button onClick={handleEnd} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><SkipForward className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">Speed:</span>
              {[1, 2, 4, 8].map((s) => (
                <button key={s} onClick={() => setSpeed(s)} className={`px-2 py-1 rounded text-xs font-medium ${speed === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {s}x
                </button>
              ))}
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute top-0 left-0 h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <input type="range" min="0" max={data.locations.length - 1} value={currentIndex} onChange={(e) => { setIsPlaying(false); setCurrentIndex(Number(e.target.value)); }} className="w-full mt-2" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Trip Info</h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-500">Total Points</span><span className="font-medium">{data.locations.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-medium">{data.trip?.actualDuration || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Distance</span><span className="font-medium">{data.trip?.distance ? `${data.trip.distance} km` : 'N/A'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
