import { ReactNode } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-end px-6 py-3 border-b border-gray-200 bg-white">
          <ThemeToggle />
        </header>
        <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
