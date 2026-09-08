'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Shield, Mail, Phone, Building, Home, CheckCircle2 } from 'lucide-react';

export default function WardenProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Hostel Warden Profile</h1>
        <p className="text-xs text-gray-400">
          Official residential authority credentials and campus housing oversight.
        </p>
      </div>

      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#282f42]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-black font-extrabold text-2xl flex items-center justify-center shadow-lg">
            W
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.fullName || 'Dr. S. K. Mohapatra'}</h2>
            <div className="text-xs text-gray-400 font-mono mt-0.5">
              Hostel Block: <span className="text-emerald-400 font-bold">BLOCK B (Men&apos;s Wing)</span> • {user?.role}
            </div>
            <div className="inline-block mt-1.5 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
              CHIEF RESIDENTIAL WARDEN
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#181b26] p-4 rounded-xl border border-[#282f42] space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Administrative Assignment
            </span>
            <div className="flex items-center gap-2 text-gray-300">
              <Home size={14} className="text-emerald-400" />
              <span>Assigned Hostel: <strong>Block B (15 Rooms, 3 Floors)</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Building size={14} className="text-emerald-400" />
              <span>Office: <strong>Block B Warden Office, Ground Floor</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Shield size={14} className="text-emerald-400" />
              <span>Authority: <strong>Gate Pass &amp; Leave Approval</strong></span>
            </div>
          </div>

          <div className="bg-[#181b26] p-4 rounded-xl border border-[#282f42] space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Official Contact
            </span>
            <div className="flex items-center gap-2 text-gray-300">
              <Mail size={14} className="text-gray-400" />
              <span>Email: <strong>warden.b@nexora.edu</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Phone size={14} className="text-gray-400" />
              <span>Emergency Phone: <strong>+91 9876543230</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
