'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Wrench, Mail, Phone, Building, Shield, CheckCircle } from 'lucide-react';

export default function StaffProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Maintenance Staff Profile</h1>
        <p className="text-xs text-gray-400">
          Campus technician credentials, operational department, and assigned specialization.
        </p>
      </div>

      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#282f42]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-black font-extrabold text-2xl flex items-center justify-center shadow-lg">
            {user?.fullName ? user.fullName[0] : 'R'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.fullName || 'Ramesh Kumar'}</h2>
            <div className="text-xs text-gray-400 font-mono mt-0.5">
              Emp ID: <span className="text-amber-400 font-bold">{user?.employeeId || 'STF-PLUMB-01'}</span> • {user?.role}
            </div>
            <div className="inline-block mt-1.5 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
              ACTIVE FIELD TECHNICIAN • ON DUTY
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#181b26] p-4 rounded-xl border border-[#282f42] space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Work Assignment
            </span>
            <div className="flex items-center gap-2 text-gray-300">
              <Building size={14} className="text-amber-400" />
              <span>Department: <strong>{user?.department || 'Maintenance'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Wrench size={14} className="text-amber-400" />
              <span>Specialization: <strong>{user?.specialization || 'PLUMBING'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Shield size={14} className="text-emerald-400" />
              <span>Authorization: <strong>Campus-Wide Maintenance Access</strong></span>
            </div>
          </div>

          <div className="bg-[#181b26] p-4 rounded-xl border border-[#282f42] space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Contact Channels
            </span>
            <div className="flex items-center gap-2 text-gray-300">
              <Mail size={14} className="text-gray-400" />
              <span>Email: <strong>{user?.email || 'ramesh@nexora.edu'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Phone size={14} className="text-gray-400" />
              <span>Duty Mobile: <strong>+91 9876543220</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
