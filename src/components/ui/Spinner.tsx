import { type HTMLAttributes } from 'react';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'size-4', md: 'size-6', lg: 'size-8' } as const;

export function Spinner({ className = '', size = 'md', ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
