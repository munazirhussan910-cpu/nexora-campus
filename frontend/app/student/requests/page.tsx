'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import { PriorityBadge } from '@/components/status/PriorityBadge';
import { SLAIndicator } from '@/components/status/SLAIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search, Filter, Plus, ArrowRight, Clock, MapPin, ChevronRight, Inbox } from 'lucide-react';

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
    if (filter === 'CANCELLED' && r.status !== 'CANCELLED') return false;

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-tab-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            My Requests &amp; Applications
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Complete audit trail and real-time status of all your campus submissions.
          </p>
        </div>

        <Link
          href="/student/requests/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5B20A0] hover:bg-[#6c28be] text-white font-bold text-xs shadow-md shadow-[#5B20A0]/25 transition-all active:scale-95 shrink-0"
        >
          <Plus size={15} />
          <span>+ New Request</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-lg shadow-black/15">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'OPEN', label: 'Open' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 ${
                filter === tab.id
                  ? 'bg-[#5B20A0] text-white font-bold shadow-md shadow-[#5B20A0]/30 border border-[#7A3DB8]/50'
                  : 'bg-[#161a29] text-slate-400 hover:text-white border border-[#232b3f] hover:border-[#38435f]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, title, or room..."
            className="w-full bg-[#161a29] border border-[#232b3f] focus:border-[#18C5D8] focus:ring-1 focus:ring-[#18C5D8] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 transition-all outline-none"
          />
        </div>
      </div>

      {/* Requests Container */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl shadow-black/20">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 animate-pulse space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#18C5D8] border-t-transparent animate-spin mx-auto" />
            <p>Loading your campus requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            title="No requests match your filter"
            description={
              search
                ? `No submissions found matching "${search}". Try clearing your search query.`
                : "You don't have any requests under this status filter."
            }
            icon={Inbox}
            actionText="Submit New Request"
            actionHref="/student/requests/new"
            secondaryActionText={search || filter !== 'ALL' ? 'Reset Filters' : undefined}
            onAction={
              search || filter !== 'ALL'
                ? () => {
                    setSearch('');
                    setFilter('ALL');
                  }
                : undefined
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#20273a] text-slate-400 font-mono text-[11px] bg-[#0f1320]/60">
                    <th className="py-3 px-5 font-semibold">Request</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Priority</th>
                    <th className="py-3 px-4 font-semibold">Submitted</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">SLA</th>
                    <th className="py-3 px-5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2538]">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#161c2d] transition group">
                      <td className="py-3.5 px-5">
                        <div className="font-mono font-bold text-white group-hover:text-[#18C5D8] transition">
                          {req.requestNumber}
                        </div>
                        <div className="text-slate-300 font-medium truncate max-w-sm mt-0.5">
                          {req.title}
                        </div>
                        {req.location && (
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {req.location}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1b2234] text-slate-300 border border-[#2b354d]">
                          {req.requestType?.name || req.requestTypeId || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={req.priority} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={req.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <SLAIndicator sla={req.sla} compact />
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono">
                        <Link
                          href={`/student/requests/${req.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#1b2234] hover:bg-[#5B20A0]/30 border border-[#2c364e] hover:border-[#7A3DB8] text-[#18C5D8] text-[11px] font-semibold transition"
                        >
                          <span>Details</span>
                          <ArrowRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-[#1e2538]">
              {filteredRequests.map((req) => (
                <Link
                  key={req.id}
                  href={`/student/requests/${req.id}`}
                  className="p-4 block hover:bg-[#161c2d] transition group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-white group-hover:text-[#18C5D8] transition">
                      {req.requestNumber}
                    </span>
                    <StatusBadge status={req.status} size="sm" />
                  </div>

                  <h3 className="text-xs font-semibold text-slate-200 group-hover:text-white transition line-clamp-2 mb-1.5">
                    {req.title}
                  </h3>

                  <div className="flex items-center gap-2 flex-wrap mb-2 text-[10px] font-mono text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-[#1b2234] text-slate-300 border border-[#2b354d]">
                      {req.requestType?.name || req.requestTypeId || 'General'}
                    </span>
                    <PriorityBadge priority={req.priority} />
                    {req.location && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <MapPin size={10} /> {req.location}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-[#1f2538]">
                    <span>
                      {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#18C5D8] font-semibold">
                      <span>View Ticket</span>
                      <ChevronRight size={13} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
