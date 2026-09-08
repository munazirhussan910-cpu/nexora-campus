import React from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface SLAIndicatorProps {
  sla?: {
    isOverdue: boolean;
    hoursRemaining: number;
    ageingBracket: '< 12h' | '12–24h' | '24–48h' | '> 48h';
    status: 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'COMPLETED';
    dueAt: string | Date;
  };
  compact?: boolean;
}

export function SLAIndicator({ sla, compact = false }: SLAIndicatorProps) {
  if (!sla) return null;

  const isCompleted = sla.status === 'COMPLETED';
  const isBreached = sla.status === 'BREACHED' || sla.isOverdue;
  const isAtRisk = sla.status === 'AT_RISK';

  if (compact) {
    if (isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
          <CheckCircle size={12} />
          <span>SLA Met</span>
        </span>
      );
    }

    if (isBreached) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
          <AlertTriangle size={12} />
          <span>Overdue ({sla.ageingBracket})</span>
        </span>
      );
    }

    if (isAtRisk) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
          <Clock size={12} />
          <span>Due in {sla.hoursRemaining}h</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 font-medium">
        <Clock size={12} />
        <span>On Track ({sla.hoursRemaining}h left)</span>
      </span>
    );
  }

  return (
    <div
      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
        isCompleted
          ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
          : isBreached
          ? 'bg-rose-950/40 border-rose-800 text-rose-300'
          : isAtRisk
          ? 'bg-amber-950/30 border-amber-800 text-amber-300'
          : 'bg-[#1e2230] border-[#2e3447] text-gray-300'
      }`}
    >
      <div className="flex items-center gap-2">
        {isCompleted ? (
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
        ) : isBreached ? (
          <AlertTriangle size={16} className="text-rose-400 shrink-0" />
        ) : (
          <Clock size={16} className="text-amber-400 shrink-0" />
        )}
        <div>
          <div className="font-semibold">
            {isCompleted
              ? 'SLA Resolved within target'
              : isBreached
              ? 'SLA Target Breached (Action Required)'
              : isAtRisk
              ? 'SLA At Risk (< 4h remaining)'
              : 'SLA On Track'}
          </div>
          <div className="text-[11px] opacity-80">
            Due: {new Date(sla.dueAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-[10px] uppercase tracking-wider text-gray-400">Ageing Bracket</div>
        <div className="font-mono font-bold text-xs">{sla.ageingBracket}</div>
      </div>
    </div>
  );
}
