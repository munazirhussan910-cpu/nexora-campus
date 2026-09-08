'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Bell, Check, CheckCheck, AlertTriangle, Info, Calendar } from 'lucide-react';

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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Targeted Campus Notices</h1>
        <p className="text-xs text-gray-400">
          Official communications filtered specifically for your branch, academic year, and hostel block.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading campus announcements...</div>
        ) : notices.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">No active notices for your profile.</div>
        ) : (
          notices.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border transition-all ${
                n.isRead
                  ? 'bg-[#141722] border-[#282f42] opacity-80'
                  : 'bg-[#181d2c] border-[#3d4661] shadow-lg'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {n.priority === 'URGENT' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                      <AlertTriangle size={11} /> URGENT
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
                      <Info size={11} /> NOTICE
                    </span>
                  )}

                  {n.targets?.map((t: any) => (
                    <span
                      key={t.id}
                      className="px-2 py-0.5 rounded bg-[#22283a] text-gray-300 border border-[#2e374f] text-[10px]"
                    >
                      Target: {t.targetType} ({t.targetValue})
                    </span>
                  ))}
                </div>

                <div className="text-[11px] text-gray-400 font-mono">
                  {new Date(n.publishedAt).toLocaleDateString()} at{' '}
                  {new Date(n.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <h2 className="text-sm font-bold text-gray-100 mb-2 leading-snug">{n.title}</h2>
              <p className="text-xs text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap">{n.content}</p>

              <div className="flex items-center justify-between pt-3 border-t border-[#282f42] text-[11px]">
                <span className="text-gray-400">
                  Published by: <strong>{n.authorName}</strong> ({n.authorRole})
                </span>

                {n.isRead ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium text-[11px]">
                    <CheckCheck size={14} /> Read receipt registered
                  </span>
                ) : (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gold text-black font-bold text-xs hover:bg-[#c49f2e] transition"
                  >
                    <Check size={13} /> Acknowledge / Mark Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
