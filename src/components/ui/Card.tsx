import { type HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional title shown at the top */
  title?: string;
  /** Optional accent label above title */
  label?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', title, label, children, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm transition-shadow duration-200 hover:shadow-md ${className}`}
      {...props}
    >
      {(label || title) && (
        <div className="mb-3 sm:mb-4">
          {label && (
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500" aria-hidden>
              {label}
            </p>
          )}
          {title && (
            <h2 className={label ? 'mt-1 text-lg font-semibold text-slate-800' : 'text-sm font-semibold uppercase tracking-wider text-slate-500'}>
              {title}
            </h2>
          )}
        </div>
      )}
      {children}
    </div>
  )
);
Card.displayName = 'Card';
