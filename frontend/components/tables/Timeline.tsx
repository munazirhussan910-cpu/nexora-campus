import React from 'react';
import { CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react';
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
    return <div className="text-gray-400 text-xs py-4 text-center">No timeline history recorded yet.</div>;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#282f42]">
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
                  ? 'bg-emerald-500 border-emerald-300 ring-4 ring-emerald-950'
                  : 'bg-[#1e2230] border-[#3d4661]'
              }`}
            >
              {isLatest && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </div>

            <div className="bg-[#181b26] border border-[#282f42] rounded-xl p-3.5 hover:border-[#3d4661] transition">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={item.newStatus} size="sm" />
                  {item.oldStatus && (
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <span>from {item.oldStatus}</span>
                      <ArrowRight size={10} />
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-gray-400">
                  {timeStr} • <span className="text-gray-500">{dateStr}</span>
                </div>
              </div>

              {item.comment && (
                <p className="text-xs text-gray-200 mt-1 mb-2 leading-relaxed bg-[#12151f] p-2 rounded-lg border border-[#22283a]">
                  {item.comment}
                </p>
              )}

              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-[#22283a]/60">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500">Action By:</span>
                  <span className="font-semibold text-gray-300">{actorName}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-[#202534] text-gray-400 text-[10px]">
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
