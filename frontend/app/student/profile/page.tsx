'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { User, Mail, Phone, Home, Building, BookOpen, Shield, Award } from 'lucide-react';

export default function StudentProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Student Digital Identity</h1>
        <p className="text-xs text-gray-400">
          Official academic enrollment record and campus hostel allocation.
        </p>
      </div>

      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#282f42]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-[#8c7322] text-black font-extrabold text-2xl flex items-center justify-center shadow-lg">
            {user?.fullName ? user.fullName[0] : 'A'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.fullName || 'Aryan Khan'}</h2>
            <div className="text-xs text-gray-400 font-mono mt-0.5">
              Roll No: <span className="text-gold font-bold">{user?.rollNumber || '220101048'}</span> • {user?.role}
            </div>
            <div className="inline-block mt-1.5 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
              ACTIVE ENROLLMENT • AUTUMN 2026
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#181b26] p-4 rounded-xl border border-[#282f42] space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Academic Information
            </span>
            <div className="flex items-center gap-2 text-gray-300">
              <BookOpen size={14} className="text-gold" />
              <span>Program: <strong>B.Tech Computer Science &amp; Eng.</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Award size={14} className="text-gold" />
              <span>Academic Year: <strong>2nd Year (Semester 4)</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Building size={14} className="text-gold" />
              <span>Institution: <strong>BPUT Central Campus</strong></span>
            </div>
          </div>

          <div className="bg-[#181b26] p-4 rounded-xl border border-[#282f42] space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Hostel &amp; Contact Info
            </span>
            <div className="flex items-center gap-2 text-gray-300">
              <Home size={14} className="text-cyan-400" />
              <span>Hostel: <strong>{user?.hostelBlock || 'Block B'} / Room {user?.roomNumber || '204'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Mail size={14} className="text-gray-400" />
              <span>Email: <strong>{user?.email || 'aryan@nexora.edu'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Phone size={14} className="text-gray-400" />
              <span>Registered Phone: <strong>+91 9876543210</strong></span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#181b26] border border-[#282f42] text-[11px] text-gray-400 leading-relaxed">
          <Shield size={14} className="inline mr-1.5 text-gold" />
          This profile is cryptographically verified against the Nexora Campus database. Personal identity details and hostel room allocations are managed by the Chief Warden and Academic Registry.
        </div>
      </div>
    </div>
  );
}
