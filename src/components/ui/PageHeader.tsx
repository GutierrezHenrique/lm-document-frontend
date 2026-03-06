import { type ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between pb-3 sm:pb-5 border-b border-slate-200/60">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && (
          <p className="mt-1 sm:mt-1.5 text-slate-500 text-xs sm:text-sm lg:text-base max-w-2xl line-clamp-2 sm:line-clamp-none">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
