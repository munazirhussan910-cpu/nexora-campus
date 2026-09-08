'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import { PriorityBadge } from '@/components/status/PriorityBadge';
import { SLAIndicator } from '@/components/status/SLAIndicator';
import { Wrench, MapPin, User, Search, AlertCircle } from 'lucide-react';

export default function WardenComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      const res = await apiRequest('/requests?type=COMPLAINT&hostel=Block B');
      if (res.success && res.data) {
        setComplaints(res.data);
      }
      setLoading(false);
    };
    fetchComplaints();
  }, []);

  const filtered = complaints.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const num = c.requestNumber?.toLowerCase().includes(q);
      const title = c.title?.toLowerCase().includes(q);
      const loc = c.location?.toLowerCase().includes(q);
      if (!num && !title && !loc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Hostel Block B Complaints</h1>
          <p className="text-xs text-gray-400">
            Real-time tracking of plumbing, electrical, and facility repair requests inside Block B.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by room, category, or ID..."
            className="w-full bg-[#141722] border border-[#282f42] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      <div className="bg-[#141722] border border-[#282f42] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading complaints...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">No active complaints found for Block B.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#181b26] transition text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-amber-300">
                      {c.requestNumber}
                    </span>
                    <StatusBadge status={c.status} size="sm" />
                    <PriorityBadge priority={c.priority} />
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#202535] text-gray-300 border border-[#2d364d]">
                      Category: {c.complaint?.category || 'General'}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-gray-100">{c.title}</h3>
                  <p className="text-[11px] text-gray-400 line-clamp-1">{c.description}</p>

                  <div className="flex items-center gap-4 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-gray-400" /> {c.location}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User size={12} className="text-gray-400" /> {c.requester?.student?.fullName || c.requester?.username}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <SLAIndicator sla={c.sla} compact />
                  {c.assignedStaff?.staff ? (
                    <span className="text-[11px] text-gray-400">
                      Assigned: <strong className="text-gray-200">{c.assignedStaff.staff.fullName}</strong>
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-400 italic">Pending assignment</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
