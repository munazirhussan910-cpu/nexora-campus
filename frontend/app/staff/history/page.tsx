'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Star, CheckCircle2, User, Clock, MapPin } from 'lucide-react';

export default function StaffHistoryPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const res = await apiRequest('/complaints/assigned?status=RESOLVED');
      if (res.success && res.data) {
        setTasks(res.data);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const completed = tasks.filter((t) =>
    ['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(t.status)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Resolved Work Orders &amp; Student Ratings</h1>
        <p className="text-xs text-gray-400">
          Historical log of completed maintenance assignments, resolution notes, and student satisfaction feedback.
        </p>
      </div>

      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading history...</div>
        ) : completed.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">No resolved tasks found yet.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {completed.map((t) => (
              <div key={t.id} className="py-5 space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-300">{t.requestNumber}</span>
                    <StatusBadge status={t.status} size="sm" />
                    <span className="font-semibold text-gray-100">{t.title}</span>
                  </div>

                  <div className="text-[11px] text-gray-500 font-mono">
                    Completed on: {t.completedAt ? new Date(t.completedAt).toLocaleDateString() : 'Recent'}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-gray-500" /> {t.location}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User size={12} className="text-gray-500" /> {t.requester?.student?.fullName || t.requester?.username}
                  </span>
                </div>

                {t.complaint?.resolutionNotes && (
                  <div className="bg-[#181b26] p-3 rounded-lg border border-[#282f42] text-[11px] text-gray-300">
                    <strong className="text-amber-400 block mb-0.5">Your Resolution Notes:</strong>
                    {t.complaint.resolutionNotes}
                  </div>
                )}

                {t.complaint?.studentRating ? (
                  <div className="flex items-center gap-2 pt-1 text-[11px]">
                    <span className="text-gray-400">Student Rating:</span>
                    <div className="flex items-center text-gold">
                      {[...Array(t.complaint.studentRating)].map((_, i) => (
                        <Star key={i} size={13} className="fill-[#d4af37]" />
                      ))}
                    </div>
                    <span className="font-bold text-gold">({t.complaint.studentRating}/5)</span>
                    {t.complaint.studentFeedback && (
                      <span className="text-gray-400 italic ml-2">"{t.complaint.studentFeedback}"</span>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-500 italic pt-1">
                    Awaiting student rating feedback
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
