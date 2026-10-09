'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Wrench, Phone, Mail, User, Shield, CheckCircle2, Search, Briefcase, RefreshCw } from 'lucide-react';

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchStaff = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiRequest('/admin/staff');
      if (res.success && res.data) {
        setStaffList(res.data);
      }
    } catch (e) {
      console.error('Failed to load staff roster', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filtered = staffList.filter((s) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = s.fullName?.toLowerCase().includes(q);
      const spec = s.specialization?.toLowerCase().includes(q);
      const dep = s.department?.toLowerCase().includes(q);
      const emp = s.employeeId?.toLowerCase().includes(q);
      if (!name && !spec && !dep && !emp) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#21273a] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#d4af37] font-semibold">
              Workforce Operations
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Maintenance &amp; Operations Staff Roster
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Field technicians, specialized plumbers, electricians, security sentries, and active workloads.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, spec, or ID..."
              className="w-full bg-[#121624] border border-[#232b3f] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#d4af37] transition"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchStaff(true)}
            disabled={loading || refreshing}
            className="p-2 rounded-xl bg-[#141824] border border-[#273043] hover:border-[#d4af37]/60 text-slate-300 hover:text-white transition active:scale-95 disabled:opacity-50 shrink-0"
            title="Refresh staff roster"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#d4af37]' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-[#121624] border border-[#232b3f] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 border-b border-[#212739] flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">
            Active Personnel: <strong className="text-white">{filtered.length}</strong>
          </span>
          <span className="text-[11px] text-[#d4af37]">Real-Time Capacity Telemetry</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={18} className="animate-spin text-[#d4af37]" />
            <span>Loading staff directory...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-1">
            <Wrench size={24} className="text-slate-600 mx-auto mb-2" />
            <div className="font-semibold text-slate-400">No staff members found matching query.</div>
          </div>
        ) : (
          <div className="divide-y divide-[#1e2434]">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="p-3.5 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-[#161a29] transition text-xs"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-black font-extrabold flex items-center justify-center text-sm sm:text-base shrink-0 shadow">
                    {s.fullName?.[0] || 'S'}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-100 text-xs sm:text-sm truncate">
                        {s.fullName}
                      </span>
                      <span className="font-mono text-[#d4af37] font-bold text-[11px]">
                        ({s.employeeId})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#1c2234] text-slate-300 border border-[#2b354d] text-[10px] font-mono">
                        {s.department}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Designation: <strong className="text-slate-200">{s.designation}</strong> • Specialization:{' '}
                      <strong className="text-amber-400 font-mono">{s.specialization || 'GENERAL'}</strong>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-3 flex-wrap pt-0.5">
                      {s.user?.email && <span>Email: {s.user.email}</span>}
                      {s.user?.email && s.phone && <span>•</span>}
                      <span>Phone: {s.phone || '+91 9876543220'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1c2234]">
                  <div className="text-left sm:text-right font-mono text-xs">
                    <div className="text-cyan-400 font-bold">{s.activeTasks || 0} Active Tasks</div>
                    <div className="text-emerald-400 text-[11px]">{s.completedTasks || 0} Resolved</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
