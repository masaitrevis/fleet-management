import { ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center', className)}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const Icon = item.icon;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-slate-500 mx-1 flex-shrink-0" />
              )}
              {isLast || !item.href ? (
                <span
                  className={cn(
                    'flex items-center gap-1 text-sm',
                    isLast
                      ? 'font-medium text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-slate-400'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
