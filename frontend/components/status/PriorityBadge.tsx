import React from 'react';

interface PriorityBadgeProps {
  priority: string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const getStyle = (p: string) => {
    switch (p?.toUpperCase()) {
      case 'URGENT':
        return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/40 dark:border-rose-800 font-bold';
      case 'HIGH':
        return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800 font-semibold';
      case 'NORMAL':
        return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/40 dark:border-blue-800';
      case 'LOW':
        return 'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-900 dark:border-slate-800';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-900 dark:border-slate-800';
    }
  };

  return (
    <span
      className={`inline-flex items-center text-[10px] sm:text-[11px] font-mono uppercase px-2 py-0.5 rounded border transition-colors ${getStyle(
        priority
      )}`}
    >
      {priority}
    </span>
  );
}
