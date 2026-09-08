'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import { PriorityBadge } from '@/components/status/PriorityBadge';
import { SLAIndicator } from '@/components/status/SLAIndicator';
import { Search, Filter, Plus, ArrowRight, Clock } from 'lucide-react';

export default function StudentRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const res = await apiRequest('/requests/my');
      if (res.success && res.data) {
        setRequests(res.data);
      }
      setLoading(false);
    };
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((r) => {
    // Status Filter
    if (filter === 'OPEN' && ['RESOLVED', 'CONFIRMED', 'CLOSED', 'REJECTED', 'CANCELLED'].includes(r.status)) return false;
    if (filter === 'IN_PROGRESS' && !['ACCEPTED', 'IN_PROGRESS', 'ROUTED', 'ASSIGNED'].includes(r.status)) return false;
    if (filter === 'COMPLETED' && !['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(r.status)) return false;
    if (filter === 'REJECTED' && r.status !== 'REJECTED') return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = r.requestNumber?.toLowerCase().includes(q);
      const matchTitle = r.title?.toLowerCase().includes(q);
      const matchLoc = r.location?.toLowerCase().includes(q);
      if (!matchNum && !matchTitle && !matchLoc) return false;
    }

    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">My Requests &amp; Applications</h1>
          <p className="text-xs text-gray-400">Complete audit trail and real-time status of all your campus submissions.</p>
        </div>

        <Link
          href="/student/requests/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold text-black font-bold text-xs hover:bg-[#c49f2e] transition shadow"
        >
          <Plus size={15} /> + New Request
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filter === f
                  ? 'bg-gold text-black font-bold shadow'
                  : 'bg-[#1c2130] text-gray-400 hover:text-white border border-[#2e3447]'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, title, or location..."
            className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold"
          />
        </div>
      </div>

      {/* Requests Table / Cards */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            No campus requests found matching the current filter.
          </div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {filteredRequests.map((req) => (
              <Link
                key={req.id}
                href={`/student/requests/${req.id}`}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#181b26] transition block group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-gray-100 group-hover:text-gold transition">
                      {req.requestNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#202535] text-gray-300 border border-[#2d364d]">
                      {req.requestType?.name || req.requestTypeId}
                    </span>
                    <StatusBadge status={req.status} size="sm" />
                    <PriorityBadge priority={req.priority} />
                  </div>

                  <h3 className="text-xs font-semibold text-gray-200 group-hover:text-white transition">
                    {req.title}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span>Location: {req.location || 'Campus'}</span>
                    <span>•</span>
                    <span>Created: {new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <SLAIndicator sla={req.sla} compact />
                  <ArrowRight size={14} className="text-gray-500 group-hover:translate-x-1 group-hover:text-gold transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
