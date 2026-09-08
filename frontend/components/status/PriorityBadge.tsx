import React from 'react';

interface PriorityBadgeProps {
  priority: string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const getStyle = (p: string) => {
    switch (p?.toUpperCase()) {
      case 'URGENT':
        return 'text-rose-400 bg-rose-950/40 border-rose-800';
      case 'HIGH':
        return 'text-amber-400 bg-amber-950/40 border-amber-800';
      case 'NORMAL':
        return 'text-blue-400 bg-blue-950/40 border-blue-800';
      case 'LOW':
        return 'text-gray-400 bg-gray-900 border-gray-800';
      default:
        return 'text-gray-400 bg-gray-900 border-gray-800';
    }
  };

  return (
    <span
      className={`inline-flex items-center text-[11px] px-2 py-0.5 font-medium rounded border ${getStyle(
        priority
      )}`}
    >
      {priority}
    </span>
  );
}
