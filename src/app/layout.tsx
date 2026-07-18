import { ThemeProvider } from '@/lib/theme';
import SkipLink from '@/components/SkipLink';

export const metadata = {
  title: 'Fleet Management SaaS',
  description: 'Multi-tenant fleet management platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white antialiased">
        <ThemeProvider>
          <SkipLink />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
