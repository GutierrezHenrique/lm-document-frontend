import { type HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional class for the inner pulse effect */
  pulse?: boolean;
}

export function Skeleton({ className = '', pulse = true, ...props }: SkeletonProps) {
  return (
    <div
      className={`rounded-md bg-stone-800 ${pulse ? 'animate-pulse' : ''} ${className}`}
      aria-hidden
      {...props}
    />
  );
}

/** Skeleton for a list item (e.g. history row) */
export function SkeletonListItem() {
  return (
    <div className="rounded-lg border border-stone-700 p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}
