'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { GraduationCap, Shield, Building, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';

export default function AcademicProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Academic Officer Profile</h1>
        <p className="text-xs text-gray-400">
          Official academic credentials, certificate signing authority, and department details.
        </p>
      </div>

      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#282f42]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-black font-extrabold text-2xl flex items-center justify-center shadow-lg">
            A
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.fullName || 'Prof. Sanjeev Mohanty'}</h2>
            <div className="text-xs text-gray-400 font-mono mt-0.5">
              Emp ID: <span className="text-teal-400 font-bold">{user?.employeeId || 'ACAD-OFF-01'}</span> • {user?.role}
            </div>
            <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-800 text-[10px] font-bold">
              <CheckCircle2 size={11} />
              <span>OFFICIAL ACADEMIC CERTIFICATION AUTHORITY</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#181b26] p-4 rounded-xl border border-[#282f42] space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Jurisdiction &amp; Department
            </span>
            <div className="flex items-center gap-2 text-gray-300">
              <Building size={14} className="text-teal-400" />
              <span>Department: <strong>{user?.department || 'Academics'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <GraduationCap size={14} className="text-teal-400" />
              <span>Designation: <strong>Academic Officer</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Award size={14} className="text-teal-400" />
              <span>Authority: <strong>Bonafide &amp; Academic Credentials</strong></span>
            </div>
          </div>

          <div className="bg-[#181b26] p-4 rounded-xl border border-[#282f42] space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Contact &amp; Registry
            </span>
            <div className="flex items-center gap-2 text-gray-300">
              <Phone size={14} className="text-gray-400" />
              <span>Office Tel: <strong>+91 9876543260</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Mail size={14} className="text-gray-400" />
              <span>Official Email: <strong>academic@nexora.edu</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Shield size={14} className="text-teal-400" />
              <span>Signature Key: <strong>Digitally Registered</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
