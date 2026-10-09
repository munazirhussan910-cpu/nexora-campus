import React from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  X,
  AlertTriangle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const norm = (status || '').toUpperCase();

  const getStyleAndIcon = () => {
    switch (norm) {
      case 'APPROVED':
      case 'CONFIRMED':
      case 'RESOLVED':
      case 'VALID':
        return {
          style: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          icon: <Check size={size === 'sm' ? 10 : 12} className="text-emerald-400 stroke-[2.5]" />,
        };
      case 'IN_PROGRESS':
      case 'ACCEPTED':
      case 'ROUTED':
      case 'DEPARTED':
        return {
          style: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          icon: <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />,
        };
      case 'ASSIGNED':
        return {
          style: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
          icon: <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />,
        };
      case 'PENDING_APPROVAL':
      case 'SUBMITTED':
      case 'PENDING':
        return {
          style: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          icon: <Clock size={size === 'sm' ? 10 : 12} className="text-amber-400" />,
        };
      case 'REJECTED':
      case 'EXPIRED':
      case 'REVOKED':
      case 'CANCELLED':
        return {
          style: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
          icon: <X size={size === 'sm' ? 10 : 12} className="text-rose-400 stroke-[2.5]" />,
        };
      case 'OVERDUE':
      case 'BREACHED':
        return {
          style: 'bg-rose-500/15 text-rose-200 border-rose-500/40',
          icon: <AlertTriangle size={size === 'sm' ? 10 : 12} className="text-rose-400" />,
        };
      case 'RETURNED':
      case 'CLOSED':
        return {
          style: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
          icon: <CheckCircle2 size={size === 'sm' ? 10 : 12} className="text-slate-400" />,
        };
      default:
        return {
          style: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
          icon: <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />,
        };
    }
  };

  const formatText = (s: string) => {
    if (!s) return 'UNKNOWN';
    return s.replace(/_/g, ' ');
  };

  const sizeClass = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-mono font-medium',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 font-mono font-medium',
    lg: 'text-xs sm:text-sm px-3 py-1 gap-2 font-mono font-semibold',
  }[size];

  const { style, icon } = getStyleAndIcon();

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide uppercase transition-colors shrink-0 ${sizeClass} ${style}`}
    >
      {icon}
      <span>{formatText(status)}</span>
    </span>
  );
}
