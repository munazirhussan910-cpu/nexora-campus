import React from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  X,
  AlertTriangle,
  Radio,
  ArrowRight,
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
          style: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80 shadow-emerald-950/30',
          icon: <Check size={size === 'sm' ? 10 : 12} className="text-emerald-400 stroke-[3]" />,
        };
      case 'IN_PROGRESS':
      case 'ACCEPTED':
      case 'ROUTED':
      case 'DEPARTED':
        return {
          style: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80 shadow-cyan-950/30',
          icon: <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />,
        };
      case 'ASSIGNED':
        return {
          style: 'bg-blue-950/80 text-blue-300 border-blue-700/80 shadow-blue-950/30',
          icon: <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />,
        };
      case 'PENDING_APPROVAL':
      case 'SUBMITTED':
      case 'PENDING':
        return {
          style: 'bg-amber-950/80 text-amber-300 border-amber-700/80 shadow-amber-950/30',
          icon: <Clock size={size === 'sm' ? 10 : 12} className="text-amber-400" />,
        };
      case 'REJECTED':
      case 'EXPIRED':
      case 'REVOKED':
      case 'CANCELLED':
        return {
          style: 'bg-rose-950/80 text-rose-300 border-rose-700/80 shadow-rose-950/30',
          icon: <X size={size === 'sm' ? 10 : 12} className="text-rose-400 stroke-[3]" />,
        };
      case 'OVERDUE':
      case 'BREACHED':
        return {
          style: 'bg-rose-950/90 text-rose-200 border-rose-600 shadow-rose-950/40',
          icon: <AlertTriangle size={size === 'sm' ? 10 : 12} className="text-rose-400" />,
        };
      case 'RETURNED':
      case 'CLOSED':
        return {
          style: 'bg-[#1a2030] text-gray-300 border-[#2b354d]',
          icon: <CheckCircle2 size={size === 'sm' ? 10 : 12} className="text-gray-400" />,
        };
      default:
        return {
          style: 'bg-[#181d2a] text-gray-300 border-[#283247]',
          icon: <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />,
        };
    }
  };

  const formatText = (s: string) => {
    if (!s) return 'UNKNOWN';
    return s.replace(/_/g, ' ');
  };

  const sizeClass = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-mono font-semibold',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 font-mono font-semibold',
    lg: 'text-xs sm:text-sm px-3 py-1 gap-2 font-mono font-bold',
  }[size];

  const { style, icon } = getStyleAndIcon();

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs tracking-wide uppercase transition-colors shrink-0 ${sizeClass} ${style}`}
    >
      {icon}
      <span>{formatText(status)}</span>
    </span>
  );
}
