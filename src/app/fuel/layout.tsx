import type { ReactNode } from 'react';

export const metadata = {
  title: 'Fuel Management - Fleet Management',
};

export default function FuelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
