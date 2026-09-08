'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Key, Shield, Building, Phone, Mail } from 'lucide-react';

export default function SecurityProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Security Officer Profile</h1>
        <p className="text-xs text-gray-400">
          Gate sentry credentials, post authorization, and station assignments.
        </p>
      </div>

      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#282f42]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 text-black font-extrabold text-2xl flex items-center justify-center shadow-lg">
            S
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.fullName || 'Vikram Singh'}</h2>
            <div className="text-xs text-gray-400 font-mono mt-0.5">
              Emp ID: <span className="text-cyan-400 font-bold">{user?.employeeId || 'SEC-MAIN-01'}</span> • {user?.role}
            </div>
            <div className="inline-block mt-1.5 px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
              AUTHORIZED GATE SECURITY SENTRY
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#181b26] p-4 rounded-xl border border-[#282f42] space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Duty Assignment
            </span>
            <div className="flex items-center gap-2 text-gray-300">
              <Building size={14} className="text-cyan-400" />
              <span>Station: <strong>Main Gate Control Cabin 1</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Shield size={14} className="text-cyan-400" />
              <span>Clearance: <strong>Pass Verification &amp; Curfew Enforcement</strong></span>
            </div>
          </div>

          <div className="bg-[#181b26] p-4 rounded-xl border border-[#282f42] space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Radio &amp; Comms
            </span>
            <div className="flex items-center gap-2 text-gray-300">
              <Phone size={14} className="text-gray-400" />
              <span>Gate Station Tel: <strong>+91 9876543240</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Mail size={14} className="text-gray-400" />
              <span>Control Email: <strong>security.gate1@nexora.edu</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
