import { type ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white py-12 px-4 text-center ${className}`}>
      {icon && <div className="mb-3 text-stone-500">{icon}</div>}
      <p className="text-sm font-medium text-stone-400">{title}</p>
      {description && <p className="mt-1 text-xs text-stone-500 max-w-sm">{description}</p>}
    </div>
  );
}
