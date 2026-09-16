import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'gold' | 'blue' | 'rose' | 'amber' | 'emerald' | 'purple' | 'cyan';
  trend?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'gold',
  trend,
}: StatCardProps) {
  const colorMap = {
    gold: {
      text: 'text-[#d4af37]',
      bg: 'bg-[#d4af37]/10',
      border: 'border-[#d4af37]/25',
      glow: 'group-hover:border-[#d4af37]/50 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.12)]',
    },
    blue: {
      text: 'text-blue-400',
      bg: 'bg-blue-950/40',
      border: 'border-blue-800/30',
      glow: 'group-hover:border-blue-700/60 group-hover:shadow-[0_0_15px_rgba(96,165,250,0.12)]',
    },
    cyan: {
      text: 'text-cyan-400',
      bg: 'bg-cyan-950/40',
      border: 'border-cyan-800/30',
      glow: 'group-hover:border-cyan-700/60 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.12)]',
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-950/40',
      border: 'border-rose-800/30',
      glow: 'group-hover:border-rose-700/60 group-hover:shadow-[0_0_15px_rgba(244,63,94,0.12)]',
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-950/40',
      border: 'border-amber-800/30',
      glow: 'group-hover:border-amber-700/60 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.12)]',
    },
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-800/30',
      glow: 'group-hover:border-emerald-700/60 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.12)]',
    },
    purple: {
      text: 'text-purple-400',
      bg: 'bg-purple-950/40',
      border: 'border-purple-800/30',
      glow: 'group-hover:border-purple-700/60 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.12)]',
    },
  }[color];

  return (
    <div
      className={`group bg-[#141824] border border-[#232a3d] rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5 ${colorMap.glow}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400">
          {title}
        </span>
        <div
          className={`p-2 rounded-xl ${colorMap.bg} ${colorMap.text} border ${colorMap.border} transition-transform duration-200 group-hover:scale-105 shrink-0`}
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
            <span className="text-[11px] text-gray-400 font-medium font-mono">
              {trend}
            </span>
          )}
        </div>

        {subtitle && (
          <div className="text-[11px] text-gray-400 mt-1 truncate">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
