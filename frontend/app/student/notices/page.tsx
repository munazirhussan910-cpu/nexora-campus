'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  Info,
  Calendar,
  Shield,
  Clock,
  Radio,
} from 'lucide-react';

export default function StudentNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    setLoading(true);
    const res = await apiRequest('/notices');
    if (res.success && res.data) {
      setNotices(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleMarkRead = async (noticeId: string) => {
    await apiRequest(`/notices/${noticeId}/read`, { method: 'POST' });
    fetchNotices();
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1b2234] border border-[#d4af37]/35 text-[#d4af37] text-[10px] font-mono font-bold uppercase tracking-wider mb-2 shadow-xs">
          <Radio size={12} className="animate-pulse" />
          <span>Institutional Broadcast Network</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          Targeted Campus Notices &amp; Circulars
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
          Direct campus announcements and alerts filtered specifically for your academic department, semester, and hostel block.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-[#141824] border border-[#232b3f] animate-pulse"
              />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-3 bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-8">
            <div className="w-12 h-12 rounded-2xl bg-[#161a28] border border-[#262e42] flex items-center justify-center text-gray-500">
              <Bell size={22} />
            </div>
            <div>
              <div className="font-semibold text-gray-300">No active circulars</div>
              <div className="text-gray-500 mt-0.5">All official notices for your profile will appear here.</div>
            </div>
          </div>
        ) : (
          notices.map((n) => {
            const isUrgent = n.priority === 'URGENT';

            return (
              <div
                key={n.id}
                className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-200 ${
                  isUrgent
                    ? 'bg-gradient-to-br from-[#1c131a] to-[#141824] border-rose-800/60 shadow-lg shadow-rose-950/20'
                    : n.isRead
                    ? 'bg-[#121624] border-[#21283a] opacity-85'
                    : 'bg-[#141826] border-[#2d374f] shadow-xl shadow-black/15'
                }`}
              >
                {/* Notice Top Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isUrgent ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/90 text-rose-300 border border-rose-700 flex items-center gap-1.5 shadow-xs">
                        <AlertTriangle size={11} className="text-rose-400" />
                        <span>URGENT PRIORITY</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950/90 text-blue-300 border border-blue-700 flex items-center gap-1.5 shadow-xs">
                        <Info size={11} className="text-blue-400" />
                        <span>CAMPUS NOTICE</span>
                      </span>
                    )}

                    {n.targets?.map((t: any) => (
                      <span
                        key={t.id}
                        className="px-2 py-0.5 rounded-md bg-[#1d2435] text-gray-300 border border-[#2b354d] text-[10px] font-mono"
                      >
                        Target: {t.targetType} ({t.targetValue})
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                    <Clock size={12} className="text-gray-500" />
                    <span>
                      {new Date(n.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                      {new Date(n.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Title and Body */}
                <h2 className="text-sm sm:text-base font-bold text-white mb-2 leading-snug tracking-tight">
                  {n.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap">
                  {n.content}
                </p>

                {/* Footer and Read Acknowledgment */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#212739] text-xs">
                  <span className="text-gray-400 text-[11px]">
                    Issued by: <strong className="text-gray-200">{n.authorName}</strong>{' '}
                    <span className="text-gray-500 font-mono">({n.authorRole})</span>
                  </span>

                  {n.isRead ? (
                    <span className="text-emerald-400 flex items-center gap-1.5 font-semibold text-[11px]">
                      <CheckCheck size={15} />
                      <span>Read receipt registered</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e4c257] text-black font-bold text-xs shadow-xs active:scale-95 transition-all"
                    >
                      <Check size={14} />
                      <span>Acknowledge / Mark Read</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
