'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Wrench, Phone, Mail, User, Shield, CheckCircle2, Search, Briefcase } from 'lucide-react';

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    const res = await apiRequest('/admin/staff');
    if (res.success && res.data) {
      setStaffList(res.data);
    }
    setLoading(false);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Maintenance &amp; Operations Staff Roster</h1>
          <p className="text-xs text-gray-400">
            Field technicians, specialized plumbers, electricians, security sentries, and active workloads.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, specialization, or ID..."
            className="w-full bg-[#141722] border border-[#282f42] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold"
          />
        </div>
      </div>

      <div className="bg-[#141722] border border-[#282f42] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading staff directory...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">No staff members found.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#181b26] transition text-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-black font-extrabold flex items-center justify-center text-base shrink-0 shadow">
                    {s.fullName[0]}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-100 text-sm">{s.fullName}</span>
                      <span className="font-mono text-gold font-bold text-[11px]">
                        ({s.employeeId})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#202535] text-gray-300 border border-[#2d364d] text-[10px]">
                        {s.department}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-400">
                      Designation: <strong className="text-gray-200">{s.designation}</strong> • Specialization: <strong className="text-amber-400">{s.specialization || 'GENERAL'}</strong>
                    </div>

                    <div className="text-[11px] text-gray-500 flex items-center gap-3">
                      <span>Email: {s.user?.email}</span>
                      <span>•</span>
                      <span>Phone: {s.phone || '+91 9876543220'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right font-mono text-xs">
                    <div className="text-cyan-400 font-bold">{s.activeTasks} Active Tasks</div>
                    <div className="text-emerald-400 text-[11px]">{s.completedTasks} Resolved</div>
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
