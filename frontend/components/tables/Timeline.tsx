import React from 'react';
import { ArrowRight } from 'lucide-react';
import { StatusBadge } from '../status/StatusBadge';

export interface TimelineItem {
  id: string;
  oldStatus?: string | null;
  newStatus: string;
  comment?: string | null;
  createdAt: string | Date;
  changer: {
    id: string;
    username: string;
    role: { name: string };
    student?: { fullName: string };
    staff?: { fullName: string; designation: string };
  };
}

interface TimelineProps {
  history: TimelineItem[];
}

export function Timeline({ history }: TimelineProps) {
  if (!history || history.length === 0) {
    return <div className="text-muted-foreground text-xs py-4 text-center">No timeline history recorded yet.</div>;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
      {history.map((item, idx) => {
        const isLatest = idx === history.length - 1;
        const dateObj = new Date(item.createdAt);
        const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const actorName =
          item.changer?.student?.fullName ||
          item.changer?.staff?.fullName ||
          item.changer?.username ||
          'System Engine';
        const actorRole = item.changer?.staff?.designation || item.changer?.role?.name || 'Operations';

        return (
          <div key={item.id} className="relative group">
            {/* Timeline Marker Dot */}
            <div
              className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                isLatest
                  ? 'bg-emerald-500 border-surface ring-4 ring-emerald-500/20'
                  : 'bg-surface border-border'
              }`}
            >
              {isLatest && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </div>

            <div className="bg-surface border border-border rounded-xl p-3.5 hover:border-primary/40 transition shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={item.newStatus} size="sm" />
                  {item.oldStatus && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <span>from {item.oldStatus}</span>
                      <ArrowRight size={10} />
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">
                  {timeStr} • <span>{dateStr}</span>
                </div>
              </div>

              {item.comment && (
                <p className="text-xs text-foreground mt-1 mb-2 leading-relaxed bg-surface-secondary/70 p-2.5 rounded-lg border border-border">
                  {item.comment}
                </p>
              )}

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <span className="opacity-70">Action By:</span>
                  <span className="font-semibold text-foreground">{actorName}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-surface-secondary text-muted-foreground text-[10px] font-mono border border-border">
                  {actorRole}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
