import type { ReactNode } from 'react';

export const metadata = {
  title: 'Maintenance Management - Fleet Management',
};

export default function MaintenanceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
