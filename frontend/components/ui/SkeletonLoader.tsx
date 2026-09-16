import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-[#161a29]/80 border border-[#232b3f] rounded-xl animate-pulse ${className}`}
    />
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20 sm:h-24 w-full" />
      ))}
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 sm:h-28 w-full rounded-2xl" />
      ))}
    </div>
  );
}
