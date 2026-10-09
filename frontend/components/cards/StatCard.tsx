import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'purple' | 'cyan' | 'blue' | 'rose' | 'amber' | 'emerald' | 'gold';
  trend?: string | { label: string; direction?: string };
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'purple',
  trend,
}: StatCardProps) {
  const colorMap = {
    purple: {
      text: 'text-purple-600 dark:text-purple-300',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      border: 'border-purple-200 dark:border-purple-800/40',
      dot: 'bg-purple-500 dark:bg-purple-400',
    },
    cyan: {
      text: 'text-cyan-700 dark:text-cyan-300',
      bg: 'bg-cyan-50 dark:bg-cyan-950/30',
      border: 'border-cyan-200 dark:border-cyan-800/40',
      dot: 'bg-cyan-500 dark:bg-cyan-400',
    },
    emerald: {
      text: 'text-emerald-700 dark:text-emerald-300',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800/40',
      dot: 'bg-emerald-500 dark:bg-emerald-400',
    },
    amber: {
      text: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800/40',
      dot: 'bg-amber-500 dark:bg-amber-400',
    },
    blue: {
      text: 'text-blue-700 dark:text-blue-300',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800/40',
      dot: 'bg-blue-500 dark:bg-blue-400',
    },
    rose: {
      text: 'text-rose-700 dark:text-rose-300',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      border: 'border-rose-200 dark:border-rose-800/40',
      dot: 'bg-rose-500 dark:bg-rose-400',
    },
    gold: {
      text: 'text-amber-700 dark:text-[#d4af37]',
      bg: 'bg-amber-50 dark:bg-[#d4af37]/15',
      border: 'border-amber-200 dark:border-[#d4af37]/35',
      dot: 'bg-amber-500 dark:bg-[#d4af37]',
    },
  }[color];

  return (
    <div
      className="group relative bg-surface border border-border hover:border-primary/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-4.5 transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5 shadow-xs hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
          {title}
        </span>
        <div
          className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${colorMap.bg} ${colorMap.text} border ${colorMap.border} transition-transform duration-200 group-hover:scale-105 shrink-0`}
        >
          <Icon size={15} className="sm:w-[17px] sm:h-[17px]" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-1.5 flex-wrap">
          <div className="text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-foreground">
            {value}
          </div>
          {trend && (
            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium font-mono">
              {typeof trend === 'object' && trend !== null ? trend.label : trend}
            </span>
          )}
        </div>

        {subtitle && (
          <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 truncate">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
