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
      text: 'text-purple-300',
      bg: 'bg-[#5B20A0]/15',
      border: 'border-[#7A3DB8]/40',
      glow: 'group-hover:border-[#7A3DB8]/60 group-hover:shadow-[0_4px_20px_-2px_rgba(91,32,160,0.25)]',
      dot: 'bg-purple-400',
    },
    cyan: {
      text: 'text-cyan-300',
      bg: 'bg-[#18C5D8]/15',
      border: 'border-[#18C5D8]/40',
      glow: 'group-hover:border-[#18C5D8]/60 group-hover:shadow-[0_4px_20px_-2px_rgba(24,197,216,0.2)]',
      dot: 'bg-cyan-400',
    },
    emerald: {
      text: 'text-emerald-300',
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500/35',
      glow: 'group-hover:border-emerald-500/60 group-hover:shadow-[0_4px_20px_-2px_rgba(16,185,129,0.2)]',
      dot: 'bg-emerald-400',
    },
    amber: {
      text: 'text-amber-300',
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/35',
      glow: 'group-hover:border-amber-500/60 group-hover:shadow-[0_4px_20px_-2px_rgba(245,158,11,0.2)]',
      dot: 'bg-amber-400',
    },
    blue: {
      text: 'text-blue-300',
      bg: 'bg-blue-500/15',
      border: 'border-blue-500/35',
      glow: 'group-hover:border-blue-500/60 group-hover:shadow-[0_4px_20px_-2px_rgba(59,130,246,0.2)]',
      dot: 'bg-blue-400',
    },
    rose: {
      text: 'text-rose-300',
      bg: 'bg-rose-500/15',
      border: 'border-rose-500/35',
      glow: 'group-hover:border-rose-500/60 group-hover:shadow-[0_4px_20px_-2px_rgba(244,63,94,0.2)]',
      dot: 'bg-rose-400',
    },
    gold: {
      text: 'text-[#d4af37]',
      bg: 'bg-[#d4af37]/15',
      border: 'border-[#d4af37]/35',
      glow: 'group-hover:border-[#d4af37]/60 group-hover:shadow-[0_4px_20px_-2px_rgba(212,175,55,0.2)]',
      dot: 'bg-[#d4af37]',
    },
  }[color];

  return (
    <div
      className={`group relative bg-[#121624] border border-[#232b3f] hover:border-[#333e59] rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between hover:-translate-y-1 shadow-lg shadow-black/20 ${colorMap.glow}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div
          className={`p-2 sm:p-2.5 rounded-xl ${colorMap.bg} ${colorMap.text} border ${colorMap.border} transition-transform duration-200 group-hover:scale-105 shrink-0`}
        >
          <Icon size={18} />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white">
            {value}
          </div>
          {trend && (
            <span className="text-[11px] text-slate-400 font-medium font-mono">
              {typeof trend === 'object' && trend !== null ? trend.label : trend}
            </span>
          )}
        </div>

        {subtitle && (
          <div className="text-[11px] text-slate-400 mt-1.5 truncate">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
