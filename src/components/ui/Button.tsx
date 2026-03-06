import { type ButtonHTMLAttributes, forwardRef } from 'react';

const variants = {
  primary: 'bg-amber-500 text-stone-900 hover:bg-amber-400 focus-visible:ring-amber-500/50',
  secondary: 'border border-stone-600 text-stone-300 hover:bg-stone-800 focus-visible:ring-stone-500',
  ghost: 'text-amber-400 hover:bg-amber-500/20 focus-visible:ring-amber-500/30',
  danger: 'bg-red-600/80 text-white hover:bg-red-600 focus-visible:ring-red-500/50',
} as const;

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled ?? loading}
      className={`
        rounded-lg font-medium transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = 'Button';
