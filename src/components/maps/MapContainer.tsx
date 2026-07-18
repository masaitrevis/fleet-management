'use client';

interface MapContainerProps {
  children?: React.ReactNode;
  className?: string;
}

export default function MapContainer({ children, className = '' }: MapContainerProps) {
  return (
    <div className={`relative bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden ${className}`}>
      <div className="text-center p-8">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-gray-500 font-medium">Map View</p>
        <p className="text-sm text-gray-400 mt-1">Integrate Google Maps or Mapbox for full rendering</p>
      </div>
      {children}
    </div>
  );
}
