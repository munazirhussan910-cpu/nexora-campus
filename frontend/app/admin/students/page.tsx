'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Users, Home, Phone, Search, Mail, BookOpen, RefreshCw } from 'lucide-react';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchStudents = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiRequest('/admin/students');
      if (res.success && res.data) {
        setStudents(res.data);
      }
    } catch (e) {
      console.error('Failed to load students directory', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = students.filter((s) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = s.fullName?.toLowerCase().includes(q);
      const roll = s.rollNumber?.toLowerCase().includes(q);
      const branch = s.branch?.name?.toLowerCase().includes(q);
      const hostel = s.hostelRoom?.hostelBlock?.name?.toLowerCase().includes(q);
      if (!name && !roll && !branch && !hostel) return false;
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
              Student Records Registry
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Campus Student Directory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Enrolled undergraduate student profiles, branches, and residential allocations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, roll, branch..."
              className="w-full bg-[#121624] border border-[#232b3f] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#d4af37] transition"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchStudents(true)}
            disabled={loading || refreshing}
            className="p-2 rounded-xl bg-[#141824] border border-[#273043] hover:border-[#d4af37]/60 text-slate-300 hover:text-white transition active:scale-95 disabled:opacity-50 shrink-0"
            title="Refresh student directory"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#d4af37]' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-[#121624] border border-[#232b3f] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 border-b border-[#212739] flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">
            Enrolled Records: <strong className="text-white">{filtered.length}</strong>
          </span>
          <span className="text-[11px] text-[#d4af37]">Verified Campus Roll</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={18} className="animate-spin text-[#d4af37]" />
            <span>Loading student directory...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-1">
            <Users size={24} className="text-slate-600 mx-auto mb-2" />
            <div className="font-semibold text-slate-400">No students found matching query.</div>
          </div>
        ) : (
          <div className="divide-y divide-[#1e2434]">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="p-3.5 sm:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 hover:bg-[#161a29] transition text-xs"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#8c7322] text-black font-extrabold flex items-center justify-center text-sm sm:text-base shrink-0 shadow">
                    {s.fullName?.[0] || 'S'}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-100 text-xs sm:text-sm truncate">
                        {s.fullName}
                      </span>
                      <span className="font-mono text-[#d4af37] font-bold text-[11px]">
                        ({s.rollNumber})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                      <span>{s.branch?.name || 'Undergraduate'}</span>
                      <span>•</span>
                      <span>Year {s.year}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 text-xs text-slate-300 pt-2 md:pt-0 border-t md:border-t-0 border-[#1c2234]">
                  <div className="flex items-center gap-1.5 bg-[#171d2c] px-3 py-1.5 rounded-xl border border-[#273249] shrink-0 self-start sm:self-auto font-mono text-xs">
                    <Home size={13} className="text-cyan-400 shrink-0" />
                    <span>
                      {s.hostelRoom?.hostelBlock?.name || 'Day Scholar'}{' '}
                      {s.hostelRoom?.roomNumber ? `• Rm ${s.hostelRoom.roomNumber}` : ''}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                    <div>
                      Student:{' '}
                      <span className="font-mono text-slate-200">{s.phone || '+91 9876543210'}</span>
                    </div>
                    <div>
                      Parent:{' '}
                      <span className="font-mono text-amber-300">{s.parentPhone || '+91 9876500001'}</span>
                    </div>
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
