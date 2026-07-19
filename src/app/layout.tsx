import { ThemeProvider } from '@/lib/theme';
import SkipLink from '@/components/SkipLink';
import './globals.css';

export const metadata = {
  title: 'Fleet Management SaaS',
  description: 'Multi-tenant fleet management platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <ThemeProvider>
          <SkipLink />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
