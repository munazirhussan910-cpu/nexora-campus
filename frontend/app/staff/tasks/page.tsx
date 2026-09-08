'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import { PriorityBadge } from '@/components/status/PriorityBadge';
import { SLAIndicator } from '@/components/status/SLAIndicator';
import { Search, Wrench, MapPin, User, ArrowRight } from 'lucide-react';

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    const res = await apiRequest('/complaints/assigned');
    if (res.success && res.data) {
      setTasks(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'ASSIGNED' && t.status !== 'ASSIGNED') return false;
    if (filter === 'IN_PROGRESS' && !['ACCEPTED', 'IN_PROGRESS'].includes(t.status)) return false;
    if (filter === 'RESOLVED' && !['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(t.status)) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = t.requestNumber?.toLowerCase().includes(q);
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchLoc = t.location?.toLowerCase().includes(q);
      const matchStudent = t.requester?.student?.fullName?.toLowerCase().includes(q);
      if (!matchNum && !matchTitle && !matchLoc && !matchStudent) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Maintenance Task Queue</h1>
          <p className="text-xs text-gray-400">
            Accept, track progress, add resolution notes, and resolve assigned campus work orders.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {['ALL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filter === f
                  ? 'bg-amber-500 text-black font-bold shadow'
                  : 'bg-[#1c2130] text-gray-400 hover:text-white border border-[#2e3447]'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, title, student, room..."
            className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading work orders...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">No tasks match this filter.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#181b26] transition text-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-amber-300">
                      {t.requestNumber}
                    </span>
                    <StatusBadge status={t.status} size="sm" />
                    <PriorityBadge priority={t.priority} />
                    <span className="px-2 py-0.5 rounded bg-[#202535] text-gray-300 border border-[#2d364d] text-[10px]">
                      {t.complaint?.category}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-gray-100">{t.title}</h3>
                  <p className="text-[11px] text-gray-400 line-clamp-1">{t.description}</p>

                  <div className="flex items-center gap-4 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-gray-400" /> {t.location}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User size={12} className="text-gray-400" /> {t.requester?.student?.fullName || t.requester?.username}
                      {t.requester?.student?.phone ? ` (${t.requester.student.phone})` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <SLAIndicator sla={t.sla} compact />
                  <Link
                    href={`/staff/tasks/${t.id}`}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold transition flex items-center gap-1"
                  >
                    <span>Manage Task</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
