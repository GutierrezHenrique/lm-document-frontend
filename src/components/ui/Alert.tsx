import { type HTMLAttributes } from 'react';

const variants = {
  error: 'border-red-500/40 bg-red-950/30 text-red-400',
  success: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
  info: 'border-amber-500/30 bg-amber-950/20 text-amber-400',
} as const;

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variants;
  title?: string;
}

export function Alert({
  className = '',
  variant = 'info',
  title,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-lg border p-3 text-sm ${variants[variant]} ${className}`}
      {...props}
    >
      {title && <p className="font-medium mb-0.5">{title}</p>}
      {children}
    </div>
  );
}
