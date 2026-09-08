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
    gold: { text: 'text-[#d4af37]', bg: 'bg-[#d4af37]/10', border: 'border-[#d4af37]/30' },
    blue: { text: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-800/40' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-800/40' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-950/40', border: 'border-rose-800/40' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-800/40' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-800/40' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-800/40' },
  }[color];

  return (
    <div className="bg-[#181b26] border border-[#282f42] rounded-xl p-4 hover:border-[#3d4661] transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${colorMap.bg} ${colorMap.text}`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold font-mono tracking-tight text-white">
          {value}
        </div>
        {trend && (
          <span className="text-[11px] text-gray-400 font-medium">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="text-[11px] text-gray-500 mt-1 truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
}
