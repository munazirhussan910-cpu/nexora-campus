'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Users, Home, Phone, Search, Mail, BookOpen } from 'lucide-react';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const res = await apiRequest('/admin/students');
      if (res.success && res.data) {
        setStudents(res.data);
      }
      setLoading(false);
    };
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Campus Student Directory</h1>
          <p className="text-xs text-gray-400">
            Enrolled undergraduate student profiles, branches, and residential allocations.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll, branch..."
            className="w-full bg-[#141722] border border-[#282f42] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold"
          />
        </div>
      </div>

      <div className="bg-[#141722] border border-[#282f42] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading student directory...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">No students found.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#181b26] transition text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-[#8c7322] text-black font-extrabold flex items-center justify-center text-sm shrink-0">
                    {s.fullName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-100">{s.fullName}</span>
                      <span className="font-mono text-gold font-bold text-[11px]">
                        ({s.rollNumber})
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                      <span>{s.branch?.name}</span>
                      <span>•</span>
                      <span>Year {s.year}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-gray-300">
                  <div className="flex items-center gap-1.5 bg-[#1c2230] px-3 py-1.5 rounded-lg border border-[#2a3449]">
                    <Home size={14} className="text-cyan-400" />
                    <span>
                      {s.hostelRoom?.hostelBlock?.name || 'Block B'} / Room {s.hostelRoom?.roomNumber || '204'}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-400 space-y-0.5">
                    <div>Student Phone: <span className="font-mono text-gray-200">{s.phone || '+91 9876543210'}</span></div>
                    <div>Parent Phone: <span className="font-mono text-amber-300">{s.parentPhone || '+91 9876500001'}</span></div>
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
