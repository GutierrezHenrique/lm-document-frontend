import { type HTMLAttributes } from 'react';

const variants: Record<string, string> = {
  default: 'bg-stone-700 text-stone-300',
  type: 'bg-amber-500/20 text-amber-400',
  priority: 'bg-stone-600 text-stone-200',
  high: 'bg-orange-500/30 text-orange-400',
  critical: 'bg-red-500/30 text-red-400',
  low: 'bg-emerald-500/20 text-emerald-400',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: string;
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${variants[variant] ?? variants.default} ${className}`}
      {...props}
    />
  );
}
